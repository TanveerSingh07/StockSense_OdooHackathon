import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        levels: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    const totalQuantity = product.levels.reduce((sum: number, lvl: any) => sum + lvl.quantity, 0);

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        totalQuantity,
        isLowStock: totalQuantity <= product.reorderPoint,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, sku, categoryId, unit, reorderPoint } = body;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name.trim();
    if (unit !== undefined) updateData.unit = unit.trim();
    if (reorderPoint !== undefined) updateData.reorderPoint = Number(reorderPoint) || 0;
    if (categoryId !== undefined) updateData.categoryId = categoryId;

    if (sku !== undefined) {
      const trimmedSku = sku.trim().toUpperCase();
      if (trimmedSku !== existingProduct.sku) {
        const skuConflict = await prisma.product.findUnique({
          where: { sku: trimmedSku },
        });
        if (skuConflict) {
          return NextResponse.json(
            { success: false, message: `A product with SKU '${trimmedSku}' already exists` },
            { status: 409 }
          );
        }
        updateData.sku = trimmedSku;
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        levels: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    const totalQuantity = updatedProduct.levels.reduce((sum: number, lvl: any) => sum + lvl.quantity, 0);

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      data: {
        ...updatedProduct,
        totalQuantity,
        isLowStock: totalQuantity <= updatedProduct.reorderPoint,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        levels: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    // Delete associated stock levels and product
    await prisma.$transaction([
      prisma.stockLevel.deleteMany({
        where: { productId: id },
      }),
      prisma.product.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}
