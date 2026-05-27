import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      salonId: string;
      salonSlug: string;
      salonName: string;
    };
  }

  interface User {
    id: string;
    role: string;
    salonId: string;
    salonSlug: string;
    salonName: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    salonId: string;
    salonSlug: string;
    salonName: string;
  }
}
