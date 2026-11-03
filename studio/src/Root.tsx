import React from 'react';
import { Composition } from 'remotion';
import './engine/fonts';
import { STUDIO } from './studio.config';
import { EPISODES } from './episodes';
import { StyleSheet } from './CastSheet';
import { Thumbnail } from './thumbnail/Thumbnail';
import { TWO_CONCEPTS } from './thumbnail/concepts';
import { DOC } from './engine/episode';
import { FigureSheet } from './hist/figures';

// Composition map for The Unseen Past:
//   <Id>            the 300 s documentary (1920 x 1080, 30 fps, 9000 frames)
//   <Id>Board       the storyboard — one frame per shot at its key frame (for scripts/stills.mjs)
//   <Id>ColdOpen    the first 20 s (600 frames) — a fast render for the early visual gate
//   Thumbnail       the 1280 x 720 thumbnail, concept + headline via defaultProps
//   StyleSheet      palette, environments, figures, props on one still
//   FigureSheet     the occupation/pose sheet that ships with the figure system
//   npx remotion studio src/index.ts --port 3430

export const Root: React.FC = () => {
  const common = { width: STUDIO.width, height: STUDIO.height, fps: STUDIO.fps };
  return (
    <>
      {EPISODES.map((e) => (
        <React.Fragment key={e.id}>
          <Composition id={e.id} component={e.Main} durationInFrames={Math.max(1, e.total)} {...common} />
          <Composition id={`${e.id}Board`} component={e.Board} durationInFrames={Math.max(1, e.shotCount)} {...common} />
          <Composition id={`${e.id}ColdOpen`} component={e.ColdOpen} durationInFrames={DOC.coldOpenFrames} {...common} />
        </React.Fragment>
      ))}
      <Composition
        id="Thumbnail"
        component={Thumbnail}
        durationInFrames={1}
        width={1280}
        height={720}
        fps={STUDIO.fps}
        defaultProps={{ concept: TWO_CONCEPTS[0], headline: 'THE BOYS UP THE FLUE' }}
      />
      <Composition id="StyleSheet" component={StyleSheet} durationInFrames={1} {...common} />
      <Composition id="FigureSheet" component={FigureSheet} durationInFrames={1} {...common} />
    </>
  );
};
