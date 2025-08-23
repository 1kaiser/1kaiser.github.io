'use strict';

const { useState, useEffect } = React;

function ModelCard({ model, style, onMouseEnter, onMouseLeave, isHovered }) {
    const [edgeColor, setEdgeColor] = useState(null);

    const posterUrl = model.poster.startsWith('http')
        ? model.poster
        : model.poster.startsWith('./')
            ? model.poster.substring(2)
            : model.poster;

    useEffect(() => {
        const colorThief = new ColorThief();
        const img = new Image();

        img.crossOrigin = 'Anonymous';
        img.src = posterUrl;

        img.onload = () => {
            try {
                const dominantColor = colorThief.getColor(img);
                setEdgeColor(`rgba(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]}, 0.8)`);
            } catch (e) {
                console.error("Error getting color:", e);
            }
        };
        img.onerror = (e) => {
            console.error("Error loading image for color thief:", posterUrl, e);
        }
    }, [model.poster]);

    const combinedStyle = {
        ...style,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
    };

    const modelUrl = model.url.startsWith('http')
        ? model.url
        : model.url.startsWith('./')
            ? model.url.substring(2)
            : model.url;

    return (
        <div
            className="model-card"
            style={combinedStyle}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <model-viewer
                src={modelUrl}
                poster={posterUrl}
                alt={model.alt}
                shadow-intensity="1"
                camera-controls
                auto-rotate
            >
            </model-viewer>
            <div className="model-info-overlay">
                <h2>{model.title}</h2>
                <p>{model.description}</p>
            </div>
            {isHovered && (
                <a href={modelUrl} download className="download-button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24px" height="24px">
                        <path d="M0 0h24v24H0z" fill="none"/>
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                </a>
            )}
        </div>
    );
}

function Gallery() {
    const [activeIndex, setActiveIndex] = useState(null);
    const [cardZIndices, setCardZIndices] = useState([]);
    const [zCounter, setZCounter] = useState(0);

    useEffect(() => {
        if (window.modelsConfig) {
            const initialZIndices = window.modelsConfig.map((_, i) => i);
            setCardZIndices(initialZIndices);
            setZCounter(window.modelsConfig.length);
        }
    }, []);

    if (!window.modelsConfig || window.modelsConfig.length === 0) {
        return <p>Loading models...</p>;
    }

    const handleMouseEnter = (i) => {
        setActiveIndex(i);
        const newZIndices = [...cardZIndices];
        newZIndices[i] = zCounter;
        setCardZIndices(newZIndices);
        setZCounter(zCounter + 1);
    };

    const cards = window.modelsConfig.map((model, i) => {
        const numCards = window.modelsConfig.length;
        const isHovered = activeIndex === i;

        // A more dramatic fan effect
        const random_rotate_z = (model.initialRotation = model.initialRotation || (Math.random() * 16) - 8);
        const spread = 147; // 30% overlap
        const offset = (i - (numCards - 1) / 2) * spread;
        const translateY = Math.abs(i - (numCards - 1) / 2) * -35 + 35; // Less pronounced arc

        let transform = `translate(-50%, -50%) translateX(${offset}px) translateY(${translateY}px) rotateZ(${random_rotate_z}deg)`;

        if (isHovered) {
            // Make the hovered card pop out more
            transform = `translate(-50%, -50%) translateX(${offset}px) translateY(${translateY - 20}px) rotateZ(0deg) scale(1.1)`;
        }

        const style = {
            transform: transform,
            zIndex: cardZIndices[i],
            transition: 'transform 0.5s ease, z-index 0.5s ease', // Smooth transition
        };

        return (
            <ModelCard
                key={i}
                model={model}
                style={style}
                isHovered={isHovered}
                onMouseEnter={() => handleMouseEnter(i)}
                onMouseLeave={() => setActiveIndex(null)}
            />
        );
    });

    return (
        <div className="gallery-container">
            {cards}
        </div>
    );
}

// This is the main App component for the gallery
const GalleryApp = () => {
    return (
        <Gallery />
    );
};

const domContainer = document.querySelector('#gallery-root');
const root = ReactDOM.createRoot(domContainer);
root.render(<GalleryApp />);
