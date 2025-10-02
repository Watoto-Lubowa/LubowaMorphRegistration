/**
 * Section Transition Utilities
 * 
 * Provides utilities for smooth transitions between UI sections
 * matching the original 400ms timing from scripts.js
 */

import { ANIMATION_DURATIONS } from '@/constants'

/**
 * Transition a section out (hide with animation)
 * 
 * @param sectionId - ID of the section to transition out
 * @returns Promise that resolves when transition completes
 */
export function transitionOut(sectionId: string): Promise<void> {
  return new Promise((resolve) => {
    const section = document.getElementById(sectionId)
    if (!section) {
      console.warn(`Section ${sectionId} not found`)
      resolve()
      return
    }

    // Add transitioning-out class
    section.classList.add('transitioning-out')
    
    // Wait for animation to complete (400ms)
    setTimeout(() => {
      section.classList.add('hidden')
      section.classList.remove('transitioning-out')
      resolve()
    }, ANIMATION_DURATIONS.SECTION_TRANSITION)
  })
}

/**
 * Transition a section in (show with animation)
 * 
 * @param sectionId - ID of the section to transition in
 * @returns Promise that resolves when transition completes
 */
export function transitionIn(sectionId: string): Promise<void> {
  return new Promise((resolve) => {
    const section = document.getElementById(sectionId)
    if (!section) {
      console.warn(`Section ${sectionId} not found`)
      resolve()
      return
    }

    // Remove hidden and add transitioning-in class
    section.classList.remove('hidden')
    section.classList.add('transitioning-in')
    
    // Wait for animation to complete (400ms)
    setTimeout(() => {
      section.classList.remove('transitioning-in')
      resolve()
    }, ANIMATION_DURATIONS.SECTION_TRANSITION)
  })
}

/**
 * Smooth transition from one section to another
 * 
 * @param fromSectionId - ID of section to hide
 * @param toSectionId - ID of section to show
 * @returns Promise that resolves when both transitions complete
 */
export async function transitionBetween(
  fromSectionId: string,
  toSectionId: string
): Promise<void> {
  await transitionOut(fromSectionId)
  await transitionIn(toSectionId)
}

/**
 * Transition multiple sections at once
 * 
 * @param sectionsToHide - Array of section IDs to hide
 * @param sectionToShow - ID of section to show
 * @returns Promise that resolves when all transitions complete
 */
export async function transitionMultiple(
  sectionsToHide: string[],
  sectionToShow: string
): Promise<void> {
  // Hide all sections simultaneously
  await Promise.all(sectionsToHide.map(id => transitionOut(id)))
  
  // Show the target section
  await transitionIn(sectionToShow)
}

/**
 * Check if a section is currently transitioning
 * 
 * @param sectionId - ID of section to check
 * @returns true if section is transitioning
 */
export function isTransitioning(sectionId: string): boolean {
  const section = document.getElementById(sectionId)
  if (!section) return false
  
  return section.classList.contains('transitioning-out') || 
         section.classList.contains('transitioning-in')
}

/**
 * Vue composable for section transitions
 */
export function useSectionTransitions() {
  return {
    transitionOut,
    transitionIn,
    transitionBetween,
    transitionMultiple,
    isTransitioning
  }
}

/**
 * Section IDs for the registration flow
 */
export const SECTION_IDS = {
  IDENTITY: 'identitySection',
  CONFIRMATION: 'confirmationSection',
  NO_RECORD: 'noRecordSection',
  COMPLETION: 'completionSection',
  LOGIN: 'loginSection',
  MAIN_CONTAINER: 'mainContainer'
} as const

/**
 * Common transition sequences for the registration flow
 */
export const TRANSITIONS = {
  /**
   * Identity → Confirmation (record found)
   */
  toConfirmation: async () => {
    await transitionBetween(SECTION_IDS.IDENTITY, SECTION_IDS.CONFIRMATION)
  },
  
  /**
   * Identity → No Record (not found)
   */
  toNoRecord: async () => {
    await transitionBetween(SECTION_IDS.IDENTITY, SECTION_IDS.NO_RECORD)
  },
  
  /**
   * Confirmation → Completion (identity confirmed)
   */
  toCompletion: async () => {
    await transitionBetween(SECTION_IDS.CONFIRMATION, SECTION_IDS.COMPLETION)
  },
  
  /**
   * No Record → Completion (create new)
   */
  noRecordToCompletion: async () => {
    await transitionBetween(SECTION_IDS.NO_RECORD, SECTION_IDS.COMPLETION)
  },
  
  /**
   * Confirmation → Identity (deny identity)
   */
  backToIdentity: async () => {
    await transitionMultiple(
      [SECTION_IDS.CONFIRMATION, SECTION_IDS.NO_RECORD],
      SECTION_IDS.IDENTITY
    )
  },
  
  /**
   * No Record → Identity (search again)
   */
  noRecordToIdentity: async () => {
    await transitionBetween(SECTION_IDS.NO_RECORD, SECTION_IDS.IDENTITY)
  },
  
  /**
   * Completion → Identity (reset/start over)
   */
  resetToIdentity: async () => {
    await transitionMultiple(
      [SECTION_IDS.COMPLETION, SECTION_IDS.CONFIRMATION, SECTION_IDS.NO_RECORD],
      SECTION_IDS.IDENTITY
    )
  },
  
  /**
   * Login → Main (successful login)
   */
  loginToMain: async () => {
    await transitionBetween(SECTION_IDS.LOGIN, SECTION_IDS.MAIN_CONTAINER)
  },
  
  /**
   * Main → Login (logout)
   */
  mainToLogin: async () => {
    await transitionBetween(SECTION_IDS.MAIN_CONTAINER, SECTION_IDS.LOGIN)
  }
} as const
