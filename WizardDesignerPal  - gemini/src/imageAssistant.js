import { auth } from "@canva/user";
import * as tf from '@tensorflow/tfjs';  // needs to be installed
import * as bodyPix from '@tensorflow-models/body-pix'; // needs to be installed

const imageAssistant = async (action, userPrompt, selectedImageUrl) => {

  try {

      console.log('Parameters Image Assistant: ', action, userPrompt, selectedImageUrl);

     if (action === 'new image variation'){

      let botReponseAdvice;

        const BACKEND_URL = `${BACKEND_HOST}/gemini-vision-route`;
        const token = await auth.getCanvaUserToken();
        const res = await fetch(BACKEND_URL, {
          method: 'POST', // Use POST method
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action, userPrompt, selectedImageUrl }), // Send parameters in the body
        });

        const body_image_desc = await res.json();
        botReponseAdvice = body_image_desc.image; /// this is to show
        

       const userPromptVariation = `Please create a new image based on this description: ${body_image_desc.image}`;

        console.log('New Image Variation userPrompt - imageAssistant', userPromptVariation);

        const BACKEND_URLV = `${BACKEND_HOST}/gemini-image-route`;
        const tokenV = await auth.getCanvaUserToken();
        const resV = await fetch(BACKEND_URLV, {
          method: 'POST', // Use POST method
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenV}`,
          },
          body: JSON.stringify({userPromptVariation}), // Send parameters in the body
        });
        const body = await resV.json();
    
        console.log('AI body', body);
        console.log('AI generated Image - imageAssistant', body.image);
        

        botReponseAdvice = body.image;
        //botReponseAdvice = '';
        return botReponseAdvice;

      } else {


        let botReponseAdvice;

        const BACKEND_URL = `${BACKEND_HOST}/gemini-vision-route`;
        const token = await auth.getCanvaUserToken();
        const res = await fetch(BACKEND_URL, {
          method: 'POST', // Use POST method
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action, userPrompt, selectedImageUrl }), // Send parameters in the body
        });
        const body = await res.json();
    
        console.log('AI body', body);
        console.log('AI generated Advice - imageAssistant', body.image);
    

      botReponseAdvice = body.image;
      console.log('Bot Response received: ', botReponseAdvice);
      return botReponseAdvice;
    
}

  } catch (error) {
    console.error('Error processing image:', error);
    return null;
  }
};

export default imageAssistant;
