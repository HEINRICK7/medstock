import { useEffect, useState } from "react";

export function useAuth() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");
    if (usuario) {
      const { role } = JSON.parse(usuario);
      setRole(role);
    }
  }, []);

  return role;
}
