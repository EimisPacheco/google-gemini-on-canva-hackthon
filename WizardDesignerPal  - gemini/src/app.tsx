import React, { useState, useEffect, useRef } from "react";
import { Button, Text, FormField, MultilineInput, Avatar, Rows, ProgressBar, Select } from "@canva/app-ui-kit";
import { TextAttributes, SelectionEvent, setCurrentPageBackground } from "@canva/design";
import { getTemporaryUrl, upload, openColorSelector, Anchor, ColorSelectionEvent, ColorSelectionScope } from "@canva/asset";
import { useSelection } from "utils/use_selection_hook";
import styles from "styles/components.css";
import imageAssistant from './imageAssistant';
import simulateColorBlindness from './simulateColorBlindness';
import ReactMarkdown from 'react-markdown';
import imageProcessor from './imageProcessor';

export const App = () => {
  const [userPrompt, setUserPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [messages, setMessages] = useState([]);
  const [colorBlindnessType, setColorBlindnessType] = useState("");
  const [hasShownSimulationMessage, setHasShownSimulationMessage] = useState(false);
  const [botSimulationComments, setBotSimulationComments] = useState(null);
  const chatboxBodyRef = useRef(null);
  const intervalIdRef = useRef(null);
  const selection = useSelection("image");
  

  const loadOriginalImage = async (selection: SelectionEvent<"image">) => {
    if (selection.count !== 1) {
      return null;
    }
    const draft = await selection.read();
    const { url } = await getTemporaryUrl({
      type: "IMAGE",
      ref: draft.contents[0].ref,
    });
    return url;
  };

  useEffect(() => {
    if (chatboxBodyRef.current) {
      chatboxBodyRef.current.scrollTop = chatboxBodyRef.current.scrollHeight;
    }
  }, [messages]);

  const botResponseClick = (bot_response) => {
    sendMessage(bot_response, 'bot');
  };

  const handleOptionClick = async (action) => {
    let customMessage = '';
    let selectedImageUrl = null;

    if (action === 'background recommender' || action === 'new image variation') {
      botResponseClick("Sure! please allow me some seconds while your " + (action === 'new image variation' ? 'image variation' : 'background recommendation') + " is completed");

      setLoading(true);
      setProgress(0);
      startProgressBar();

      if (selection.count === 1) {
        selectedImageUrl = await loadOriginalImage(selection);
        console.log('Canva Selected Temporary URL: ', selectedImageUrl);
      }

      if (action === 'background recommender') {
        customMessage = 'Recommend a background for this image';
        await submitMessage(customMessage, "indirect user interaction", action, selectedImageUrl);

        const botBackgroundRecomendation = await imageAssistant(action, customMessage, selectedImageUrl);
        botResponseClick(botBackgroundRecomendation);

        console.log("botBackgroundRecomendation: " + botBackgroundRecomendation);

        console.log("AI generated Advice - app: " + action + ", botBackgroundRecomendation");

        const imageGeneratedUrl = await imageProcessor("change background", botBackgroundRecomendation, selectedImageUrl, null, null, null, null, null, null, null);

        console.log("AI generated URL - app: " + action + ", imageGeneratedUrl");

        if (imageGeneratedUrl) {
          const { ref: imageRef } = await upload({
            type: "IMAGE",
            url: imageGeneratedUrl,
            mimeType: "image/png",
            thumbnailUrl: imageGeneratedUrl,
          });

          const draft = await selection.read();
          draft.contents.forEach((s) => (s.ref = imageRef));
          await draft.save();
        }
      }

      if (action === 'new image variation') {
        
        customMessage = 'Create a new image variation based on the description of the current image';
        await submitMessage(customMessage, "indirect user interaction", action, selectedImageUrl);

        const imageGeneratedUrl = await imageAssistant(action, customMessage, selectedImageUrl);

        console.log("AI generated URL - app: " + action + ", imageGeneratedUrl");

        if (imageGeneratedUrl) {
          const { ref: imageRef } = await upload({
            type: "IMAGE",
            url: imageGeneratedUrl,
            mimeType: "image/png",
            thumbnailUrl: imageGeneratedUrl,
          });

          const draft = await selection.read();
          draft.contents.forEach((s) => (s.ref = imageRef));
          await draft.save();
        }
      }

      stopProgressBar();
    }

    switch (action) {
      case 'quality check':
        customMessage = 'Perform a quality check on the image';
        break;
      case 'image description':
        customMessage = 'Create an image description for this image';
        break;
      case 'design accessibility':
        customMessage = 'Check design accessibility for this image';
        break;
      default:
        customMessage = 'Processing your request...';
    }


    if (action !== 'background recommender' && action !== 'new image variation') {
      await submitMessage(customMessage, "indirect user interaction", action, selectedImageUrl);
      setLoading(false);
    }
  };

  const handleColorBlindnessSimulation = async (type) => {
    if (!hasShownSimulationMessage) {
      botResponseClick("I see that you are interested in the color blindness simulation, that's cool!");
      setHasShownSimulationMessage(true);
    }

    setLoading(true);
    setProgress(0);
    startProgressBar();

    if (selection.count === 1) {
      const selectedImageUrl = await loadOriginalImage(selection);

      if (!botSimulationComments) {
        const simulationComments = await imageAssistant("color blindness simulation", "", selectedImageUrl);
        setBotSimulationComments(simulationComments);
      }

      console.log('Canva Selected Temporary URL: ', selectedImageUrl);

      const simulatedImageUrl = await simulateColorBlindness(type, selectedImageUrl);

      console.log("Simulated Color Blindness Image URL - app: " + type + ", simulatedImageUrl");

      if (simulatedImageUrl) {
        const { ref: imageRef } = await upload({
          type: "IMAGE",
          url: simulatedImageUrl,
          mimeType: "image/png",
          thumbnailUrl: simulatedImageUrl,
        });

        const draft = await selection.read();
        draft.contents.forEach((s) => (s.ref = imageRef));
        await draft.save();
      }
    }

    stopProgressBar();
    setLoading(false);
  };

  const startProgressBar = () => {
    const ESTIMATED_TIME_TO_COMPLETE_IN_MS = 30 * 1_000; // 30 seconds
    const INTERVAL_DURATION_IN_MS = 100; // 0.1 seconds
    const TOTAL_PROGRESS_PERCENTAGE = 100;
    const totalNumberOfProgressBarUpdates = Math.ceil(ESTIMATED_TIME_TO_COMPLETE_IN_MS / INTERVAL_DURATION_IN_MS);
    let updateCount = 1;

    intervalIdRef.current = setInterval(() => {
      if (updateCount > totalNumberOfProgressBarUpdates) {
        clearInterval(intervalIdRef.current);
        return;
      }
      setProgress((prevProgress) => {
        const nextProgressValue = prevProgress + Math.ceil(TOTAL_PROGRESS_PERCENTAGE / totalNumberOfProgressBarUpdates);
        return Math.min(nextProgressValue, TOTAL_PROGRESS_PERCENTAGE);
      });
      updateCount += 1;
    }, INTERVAL_DURATION_IN_MS);
  };

  const stopProgressBar = () => {
    clearInterval(intervalIdRef.current);
    setLoading(false);
    setProgress(0);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitMessage(userPrompt.trim(), "direct user interaction");
    }
  };

  const submitMessage = async (message, interactionType, action = null, selectedImageUrl = null) => {
    if (message !== '') {
      sendMessage(message, 'user');

      let botResponse;

        if (selection.count === 1) {
          selectedImageUrl = await loadOriginalImage(selection);
          console.log('Canva Selected Temporary URL: ', selectedImageUrl);
        }
        botResponse = await imageAssistant(action, message, selectedImageUrl);
       if (interactionType === "indirect user interaction") {

        if (action === "quality check" || action === "image description" || action === "design accessibility") {

          console.log('PERRO AQUI ESTOY', selectedImageUrl);
          botResponse = await imageAssistant(action, message, selectedImageUrl);
        }
      }

      if (botResponse) {
        if (action !== "new image variation") { 
        console.log('AI generated Advice - app \n', botResponse);
        botResponseClick(botResponse);
        }
        if (interactionType === "direct user interaction") {
          setUserPrompt("");
        }
      }
    }
  };

  const sendMessage = (message, sender) => {
    setMessages((prevMessages) => [...prevMessages, { message, sender }]);
  };

  return (
    <div style={{
      width: '316px',
      height: '950px',
      backgroundColor: '#333333',
      borderRadius: '10px',
      boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      margin: '0px',
      flexShrink: 0
    }}>
      <div style={{
        background: 'linear-gradient(90deg, #3dc0cd, #7335e6)',
        color: '#fff',
        padding: '10px',
        borderTopLeftRadius: '10px',
        borderTopRightRadius: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '14px' }}>🧙‍♂️</div>
        <div style={{
          marginLeft: '10px',
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          fontSize: '14px'
        }}>Wizard Designer Pal</div>
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px',
        borderBottom: '1px solid #ddd'
      }}>
        <div style={{ fontSize: '14px' }}>
          <Avatar
            buttonAriaLabel="Wizard Designer Pal"
            name="WizardDesignerPal"
            photo="https://hackthons-eimis-pacheco-2024.s3.amazonaws.com/WizardDesignerPalApp.png"
          />
        </div>
        <div style={{ fontSize: '14px', marginTop: '0px', textAlign: 'center' }}>
          Your Ultimate Design Companion
        </div>
      </div>
      <div ref={chatboxBodyRef} id="chatbox-body" style={{
        flexGrow: 1,
        padding: '4px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        fontSize: '10px',
        marginTop: '0px',
        marginBottom: '0px'
      }}>
        {messages.map((msg, index) => (
          <div key={index} className={"message " + msg.sender} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            marginTop: '4px',
            marginBottom: '4px'
          }}>
            {msg.sender === 'bot' && <div className="icon">🧙‍♂️</div>}
            <div 
              className="text" 
              style={{
                backgroundColor: msg.sender === 'user' ? '#7335e6' : '#3dc0cd',
                color: '#fff',
                padding: '4px',
                borderRadius: '8px',
                maxWidth: '90%',
                textAlign: msg.sender === 'user' ? 'right' : 'left',
                fontSize: '10px',
                marginTop: '0px',
                marginBottom: '0px'
              }}
            >
              <ReactMarkdown>
                {msg.message}
              </ReactMarkdown>
            </div>
            {msg.sender === 'user' && <div className="icon">👨</div>}
          </div>
        ))}
      </div>
      <div id="initial-options" style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '2px',
        borderTop: '1px solid #ddd',
        justifyContent: 'center',
        background: 'linear-gradient(90deg, #3dc0cd, #7335e6)',
      }} />
      <form id="messageForm" method="post" style={{ flexGrow: 0 }}>
        <div style={{
          padding: '2px',
          borderTop: '1px solid #ddd',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#666666',
          borderBottomLeftRadius: '10px',
          borderBottomRightRadius: '10px'
        }}>
          <MultilineInput<TextAttributes["userPrompt"]>
            placeholder="Enter your message..."
            value={userPrompt}
            onChange={(value) => setUserPrompt(value)}
            onKeyPress={handleKeyPress}
            style={{
              flexGrow: 1,
              padding: '5px',
              border: 'none',
              borderRadius: '20px',
              backgroundColor: '#888888',
              marginRight: '5px',
              fontSize: '14px'
            }}
          />
          <Button
            variant="tertiary"
            onClick={() => submitMessage(userPrompt.trim(), "direct user interaction")}
            disabled={selection.count === 0}
            size="small"
          >
            ►
          </Button>
        </div>
      </form>
      <div style={{ padding: '10px' }}>
        {loading && (
          <div>
            <ProgressBar value={progress} ariaLabel="Loading progress bar" />
            <Text size="small" align="center" style={{ marginTop: '4px' }}>Please wait while the process completes...</Text>
          </div>
        )}
        <div style={{ opacity: loading ? 0 : 1, transition: 'opacity 0.3s ease' }}>
          <br />
          <Rows spacing="1u" align="stretch">
            <Button
              variant="primary"
              onClick={() => handleOptionClick('quality check')}
              disabled={selection.count === 0}
            >
              Quality Check
            </Button>
            <Button
              variant="primary"
              onClick={() => handleOptionClick('image description')}
              disabled={selection.count === 0}
            >
              Image Description
            </Button>
            <Button
              variant="primary"
              onClick={() => handleOptionClick('background recommender')}
              disabled={selection.count === 0}
            >
              Background Recommender
            </Button>
            <Button
              variant="primary"
              onClick={() => handleOptionClick('new image variation')}
              disabled={selection.count === 0}
            >
              New Image Variation
            </Button>
            <Button
              variant="primary"
              onClick={() => handleOptionClick('design accessibility')}
              disabled={selection.count === 0}
            >
              Design Accessibility
            </Button>

            <FormField
              label="Color Blindness Simulation"
              value={colorBlindnessType}
              description="Select a type of color blindness simulation"
              control={(props) => (
                <Select<TextAttributes["colorBlindnessType"]>
                  {...props}
                  options={[
                    { value: "deuteranomaly", label: "Deuteranomaly" },
                    { value: "protanopia", label: "Protanopia" },
                    { value: "deuteranopia", label: "Deuteranopia" },
                    { value: "protanomaly", label: "Protanomaly" },
                    { value: "tritanopia", label: "Tritanopia" },
                    { value: "tritanomaly", label: "Tritanomaly" },
                    { value: "achromatopsia", label: "Achromatopsia" },
                    { value: "achromatomaly", label: "Achromatomaly" },
                  ]}
                  disabled={selection.count === 0}
                  onChange={(value) => {
                    setColorBlindnessType(value);
                    handleColorBlindnessSimulation(value);
                  }}
                />
              )}
            />

          </Rows>
        </div>
      </div>
    </div>
  );
};