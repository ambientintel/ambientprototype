import { authkitMiddleware } from "@workos-inc/authkit-nextjs";

export default authkitMiddleware({
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: [
      "/",
      "/login",
      "/callback",
      "/landing1",
      "/landing3",
      "/home",
      "/api/push/(.*)",
    ],
  },
  redirectUri: process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI,
});

export const config = {
  matcher: ["/((?!_next|favicon.ico|icon-.*|manifest\.json|.*\..*).*)"],
};
