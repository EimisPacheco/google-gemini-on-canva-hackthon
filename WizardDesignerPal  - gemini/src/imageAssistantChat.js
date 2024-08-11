import { auth } from "@canva/user";


const imageAssistantChat = async (userPrompt, selectedImageUrl) => {
  const BACKEND_URL = `${BACKEND_HOST}/gemini-vision-route`;

  console.log('Parameters Image assistant Chat: ', userPrompt, selectedImageUrl);

  try {
    const token = await auth.getCanvaUserToken();
    const res = await fetch(BACKEND_URL, {
      method: 'POST', // Use POST method
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({userPrompt, selectedImageUrl}), // Send parameters in the body
    });
    const body = await res.json();

    console.log('AI body', body);
    console.log('AI generated Response:', body.image);

    return body.image;


  } catch (error) {
    console.error('Error processing image:', error);
    return null;
  }
};

export default imageAssistantChat;
