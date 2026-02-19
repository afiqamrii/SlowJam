'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export interface SplitTextProps {
    text: string;
    className?: string;
    style?: React.CSSProperties;
    delay?: number;
    duration?: number;
    splitType?: 'chars' | 'words';
    from?: { opacity?: number; y?: number; x?: number; scale?: number };
    to?: { opacity?: number; y?: number; x?: number; scale?: number };
    threshold?: number;
    tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
    textAlign?: React.CSSProperties['textAlign'];
    ease?: string;
    onLetterAnimationComplete?: () => void;
}

const SplitText: React.FC<SplitTextProps> = ({
    text,
    className = '',
    style,
    delay = 50,
    duration = 1.25,
    ease = 'easeOut',
    splitType = 'chars',
    from = { opacity: 0, y: 40 },
    to = { opacity: 1, y: 0 },
    threshold = 0.1,
    tag = 'p',
    textAlign = 'center',
    onLetterAnimationComplete,
}) => {
    const ref = useRef<HTMLElement>(null);
    const isInView = useInView(ref, { once: true, amount: threshold });

    const units = splitType === 'chars' ? text.split('') : text.split(' ');

    const Tag = (tag || 'p') as React.ElementType;

    return (
        <Tag
            ref={ref}
            style={{
                textAlign,
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: textAlign === 'center' ? 'center' : 'flex-start',
                ...style,
            }}
            className={`overflow-hidden ${className}`}
        >
            <motion.span
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                variants={{
                    visible: { transition: { staggerChildren: delay / 1000 } },
                    hidden: {},
                }}
                onAnimationComplete={() => onLetterAnimationComplete?.()}
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: textAlign === 'center' ? 'center' : 'flex-start',
                }}
            >
                {units.map((unit, i) => (
                    <motion.span
                        key={i}
                        variants={{
                            hidden: { ...from },
                            visible: {
                                ...to,
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                transition: { duration, ease: ease as any },
                            },
                        }}
                        style={{
                            display: 'inline-block',
                            whiteSpace: unit === ' ' ? 'pre' : 'normal',
                        }}
                    >
                        {splitType === 'chars' && unit === ' ' ? '\u00A0' : unit}
                        {splitType === 'words' && i < units.length - 1 ? '\u00A0' : ''}
                    </motion.span>
                ))}
            </motion.span>
        </Tag>
    );
};

export default SplitText;
