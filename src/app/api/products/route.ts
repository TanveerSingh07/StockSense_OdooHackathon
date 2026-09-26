import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const lowStockOnly = searchParams.get("lowStock") === "true";

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categoryId && categoryId !== "all") {
      whereClause.categoryId = categoryId;
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        levels: {
          include: {
            warehouse: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Compute total quantity and check low stock
    const formattedProducts = products.map((product: any) => {
      const totalQuantity = product.levels.reduce((sum: number, lvl: any) => sum + lvl.quantity, 0);
      const isLowStock = totalQuantity <= product.reorderPoint;
      return {
        ...product,
        totalQuantity,
        isLowStock,
      };
    });

    const finalProducts = lowStockOnly
      ? formattedProducts.filter((p) => p.isLowStock)
      : formattedProducts;

    return NextResponse.json({
      success: true,
      data: finalProducts,
      total: finalProducts.length,
    });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, sku, categoryId, categoryName, unit, reorderPoint } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Product name is required" },
        { status: 400 }
      );
    }

    if (!sku || typeof sku !== "string" || !sku.trim()) {
      return NextResponse.json(
        { success: false, message: "Product SKU is required" },
        { status: 400 }
      );
    }

    const trimmedSku = sku.trim().toUpperCase();

    // Check SKU uniqueness
    const existingSku = await prisma.product.findUnique({
      where: { sku: trimmedSku },
    });

    if (existingSku) {
      return NextResponse.json(
        { success: false, message: `A product with SKU '${trimmedSku}' already exists` },
        { status: 409 }
      );
    }

    // Resolve Category ID
    let resolvedCategoryId = categoryId;
    if (!resolvedCategoryId && categoryName && typeof categoryName === "string") {
      let category = await prisma.category.findFirst({
        where: { name: { equals: categoryName.trim(), mode: "insensitive" } },
      });
      if (!category) {
        category = await prisma.category.create({
          data: { name: categoryName.trim() },
        });
      }
      resolvedCategoryId = category.id;
    }

    if (!resolvedCategoryId) {
      return NextResponse.json(
        { success: false, message: "Category is required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        sku: trimmedSku,
        categoryId: resolvedCategoryId,
        unit: unit?.trim() || "Units",
        reorderPoint: Number(reorderPoint) || 0,
      },
      include: {
        category: true,
        levels: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully",
        data: {
          ...product,
          totalQuantity: 0,
          isLowStock: 0 <= product.reorderPoint,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
