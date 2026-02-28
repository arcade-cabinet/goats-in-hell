import type { Camera } from '@babylonjs/core';
import React from 'react';
import { Engine } from 'reactylon/web';

interface EngineWrapperProps {
    camera: Camera | undefined;
    children: React.ReactNode;
}

export const EngineWrapper: React.FC<EngineWrapperProps> = ({ children }) => {
    // Inject global CSS for the canvas to make sure it fills the screen
    React.useEffect(() => {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.textContent = `
            #renderCanvas {
                width: 100%;
                height: 100%;
                display: block;
                outline: none;
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    return (
        <Engine canvasId="renderCanvas">
            {children}
        </Engine>
    );
};
