import { setConfirmationDeletion } from "../s7-profiles/s7-Profile";

export default async function Delete(postId: string) {
  //Faire une confirmation de suppression

  setConfirmationDeletion(true);

  if (!postId) {
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/posts/:{$postId}", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        postId,
      }),
    });
  } catch {
  } finally {
  }
}
