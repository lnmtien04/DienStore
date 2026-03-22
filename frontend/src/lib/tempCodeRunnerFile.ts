const BASE_URL = "http://localhost:5000";

export async function fetchProducts() {
  const res = await fetch(`${BASE_URL}/api/products`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }

  return res.json();
}