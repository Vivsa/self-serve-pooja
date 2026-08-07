import React, { useState, useEffect } from 'react';
import { designSystem } from '../styles/designSystem';

// प्रत्येक section उघड-बंद करता येणारा accordion component
const AccordionNav = ({
  sections,
  currentSectionIdx,
  currentStepIdx,
  onStepSelect,
}) => {
  // सुरुवातीला फक्त current section उघडलेला असेल
  const [openSections, setOpenSections] = useState(() => {
    const initial = {};
    sections.forEach((s, idx) => {
      initial[s.id] = idx === currentSectionIdx;
    });
    return initial;
  });

  // Active section बदलल्यावर तो आपोआप उघडावा
  useEffect(() => {
    setOpenSections((prev) => ({
      ...prev,
      [sections[currentSectionIdx].id]: true,
    }));
  }, [currentSectionIdx]);

  const toggleSection = (sectionId) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return (
    <div className="puja-scrollable" style={styles.accordionContainer}>
      {sections.map((section, sIdx) => {
        const isOpen = openSections[section.id];
        const isActiveSection = sIdx === currentSectionIdx;
        const sectionCompleted = sIdx < currentSectionIdx;

        return (
          <div key={section.id} style={styles.sectionBlock}>
            <button
              onClick={() => toggleSection(section.id)}
              style={{
                ...styles.sectionHeader,
                background: isActiveSection ? designSystem.colors.saffron : '#FFF',
                borderLeft: isActiveSection
                  ? `4px solid ${designSystem.colors.gold}`
                  : '4px solid transparent',
              }}
            >
              <div style={styles.sectionHeaderLeft}>
                <span style={styles.sectionIcon}>
                  {sectionCompleted ? '✅' : isActiveSection ? '▶️' : '⚪'}
                </span>
                <span style={{
                  ...styles.sectionTitle,
                  color: isActiveSection ? designSystem.colors.ink : '#333',
                }}>
                  {section.title}
                </span>
              </div>
              <span style={styles.chevron}>{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
              <div style={styles.stepsList}>
                {section.steps.map((step, stIdx) => {
                  const isCurrentStep = isActiveSection && stIdx === currentStepIdx;
                  const isPastStep =
                    sIdx < currentSectionIdx ||
                    (isActiveSection && stIdx < currentStepIdx);

                  return (
                    <button
                      key={step.id}
                      onClick={() => onStepSelect(sIdx, stIdx)}
                      style={{
                        ...styles.stepItem,
                        background: isCurrentStep ? designSystem.colors.gold : 'transparent',
                        color: isCurrentStep ? '#FFF' : isPastStep ? '#999' : '#333',
                        fontWeight: isCurrentStep ? '600' : '400',
                      }}
                    >
                      <span style={styles.stepDot}>
                        {isPastStep ? '✓' : '•'}
                      </span>
                      <span style={styles.stepTitle}>{step.title}</span>
                      {step.mediaType === 'audio' && <span style={styles.mediaIcon}>🎵</span>}
                      {step.mediaType === 'video' && <span style={styles.mediaIcon}>🎬</span>}
                      {step.mediaType === 'text' && <span style={styles.mediaIcon}>📖</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const styles = {
  accordionContainer: {
    width: '100%',
    maxHeight: '100%',
    overflowY: 'auto',
    fontFamily: 'Noto Devanagari, sans-serif',
  },
  sectionBlock: {
    borderBottom: '1px solid #E0D5C8',
  },
  sectionHeader: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.2s',
  },
  sectionHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  sectionIcon: {
    fontSize: '14px',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: '500',
  },
  chevron: {
    fontSize: '10px',
    color: '#999',
  },
  stepsList: {
    background: '#FAFAFA',
    padding: '4px 0',
  },
  stepItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px 10px 40px',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '13px',
    fontFamily: 'Noto Devanagari, sans-serif',
    borderRadius: '4px',
    margin: '2px 8px',
    transition: 'background 0.2s',
  },
  stepDot: {
    fontSize: '12px',
    minWidth: '14px',
  },
  stepTitle: {
    flex: 1,
  },
  mediaIcon: {
    fontSize: '12px',
    opacity: 0.6,
  },
};

export default AccordionNav;
