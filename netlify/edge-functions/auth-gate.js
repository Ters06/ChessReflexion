// This is an Edge Function that acts as a gatekeeper for our site's root.

export default async (request, context) => {
  // Check if the jwt_token cookie is present
  const token = context.cookies.get("jwt_token");

  // If there is no token, let the request proceed to the default page (index.html)
  if (!token) {
    return;
  }

  try {
    // If there is a token, we don't need to validate it here.
    // The check-auth function on the app page will do the final validation.
    // Here, we just assume the user is likely logged in and show them the app dashboard directly.
    // This prevents a flash of the login page for authenticated users.

    // Rewrite the URL to serve the app page instead of the index page.
    const url = new URL(request.url);
    url.pathname = "/app.html";

    return Response.redirect(url);
  } catch (error) {
    // If anything goes wrong (e.g., malformed token, though we don't check),
    // just let them go to the login page.
    console.error("Auth gate error:", error);
    return;
  }
};

export const config = {
  path: "/",
};
