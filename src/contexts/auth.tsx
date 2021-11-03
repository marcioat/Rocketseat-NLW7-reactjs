import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";
import { io } from "socket.io-client";

type User = {
  id: string;
  name: string;
  avatar_url: string;
  login: string;
};

type AuthContextData = {
  user: User | null;
  signInUrl: string;
  signOut: () => void;
};

type AuthProvider = {
  children: ReactNode;
};

type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    avatar_url: string;
    login: string;
  };
};

export const AuthContext = createContext({} as AuthContextData);

export function AuthProvider(props: AuthProvider) {
  const [user, setUser] = useState<User | null>(null);

  const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=76ffe3d4c3e2b37b932b`;

  function signOut() {
    setUser(null);
    localStorage.remove("@dowhile:token");
  }

  async function signIn(githubCode: string) {
    const response = await api.post<AuthResponse>("authenticate", {
      code: githubCode,
    });
    //console.log(response);

    const { token, user } = response.data;

    localStorage.setItem("@dowhile:token", token);
    api.defaults.headers.common.authorization = `Bearer ${token}`;

    setUser(user);
  }

  useEffect(() => {
    const token = localStorage.getItem("@dowhile:token");
    if (token) {
      api.defaults.headers.common.authorization = `Bearer ${token}`;
      api.get<User>("profileuser").then((response) => {
        setUser(response.data);
      });
    }
  }, []);

  useEffect(() => {
    const url = window.location.href;
    //console.log(url);

    const hasGithubCode = url.includes("?code=");
    if (hasGithubCode) {
      const [urlWithoutCode, githubCode] = url.split("?code=");

      //console.log({ urlWithoutCode, githubCode });

      window.history.pushState({}, "", urlWithoutCode);

      signIn(githubCode);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ signInUrl, user, signOut }}>
      {props.children}
    </AuthContext.Provider>
  );
}
