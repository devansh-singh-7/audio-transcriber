type SessionUser = {
  id: string;
};

type Session = {
  user: SessionUser;
};

function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(name.length + 1));
}

async function getSession({ headers }: { headers: Headers }): Promise<Session | null> {
  const userId =
    getCookieValue(headers.get("cookie"), "firebase_uid") ||
    headers.get("x-user-id");

  if (!userId) {
    return null;
  }

  return {
    user: {
      id: userId,
    },
  };
}

const auth = {
  api: {
    getSession,
  },
};

export default auth;
export { auth };
