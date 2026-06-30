import { NextResponse } from "next/server";
import {
  mergeCategories,
  getDefaultCategories,
  categoriesForPublicFilter,
} from "@/lib/categories";
import { fetchCustomCategories, fetchCategoriesFromStories } from "@/lib/firebase/categories";

export async function GET() {
  const [defaults, custom, fromStories] = await Promise.all([
    Promise.resolve(getDefaultCategories()),
    fetchCustomCategories(),
    fetchCategoriesFromStories(),
  ]);

  const categories = mergeCategories(defaults, custom, fromStories);

  return NextResponse.json({
    categories,
    filterOptions: categoriesForPublicFilter(categories),
  });
}
