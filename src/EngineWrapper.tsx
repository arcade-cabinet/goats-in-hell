import type { Camera } from '@babylonjs/core';
import React from 'react';
import { NativeEngine } from 'reactylon/mobile';

interface EngineWrapperProps {
    camera: Camera | undefined;
    children: React.ReactNode;
}

export const EngineWrapper: React.FC<EngineWrapperProps> = ({ camera, children }) => {
    return (
        <NativeEngine camera={camera as Camera}>
            {children}
        </NativeEngine>
    );
};
