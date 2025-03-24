# Auto Auto - Chrome Extension Documentation

## Overview
Auto Auto is a Chrome extension designed to automate browser interactions by recording user actions and replaying them. This extension can be particularly useful for repetitive tasks across web applications, with special handling for Google Sheets.

## Architecture

The extension consists of three main JavaScript components:

### 1. Background Script (background.js)
The background script serves as the central controller for the extension:

- **State Management**: 
  - `amIAutomating`: Tracks if automation is currently running
  - `amisure`: Indicates if the extension is ready to start automation

- **Key Responsibilities**:
  - Manages the automation state
  - Handles messages from the popup and content scripts
  - Communicates with the host module for automation logic
  - Manages clipboard operations
  - Controls the extension icon (red/green) based on automation state

### 2. Content Script (content.js)
The content script runs in the context of web pages and monitors user interactions:

- **Event Capturing**:
  - Listens for DOM events (clicks, key presses, focus changes)
  - Identifies clickable elements and tracks user interactions
  - Handles special cases for Google Sheets operations

- **Automation Execution**:
  - Receives commands from the background script
  - Executes automated actions on the webpage
  - Manages clipboard operations within the page context

### 3. Popup UI (popup.js)
The popup script controls the extension's user interface:

- **User Controls**:
  - Start automation with specified repetitions
  - Select speed mode (slow, medium, quick)
  - Halt ongoing automation

- **UI Management**:
  - Updates interface based on current automation state
  - Communicates with background script to trigger actions

## Workflow

1. **Recording Phase**:
   - User interacts with webpages
   - Content script captures these events
   - Events are sent to the background script for processing

2. **Automation Phase**:
   - User clicks "Start" in the popup
   - Background script initiates automation through the host module
   - Commands are sent to content script to replay actions
   - Actions are repeated based on user-specified repetitions

3. **Special Features**:
   - Clipboard handling for copy/paste operations
   - Special handling for Google Sheets
   - Different speed modes for automation execution

## Technical Implementation

The extension uses Chrome's messaging API for communication between components:
- Content script → Background script: Send captured events
- Background script → Content script: Send automation commands
- Popup → Background script: Send user control commands

The automation logic is primarily handled by the host module, which processes recorded events and determines how to replay them.

## Use Cases

- Automating repetitive data entry tasks
- Batch processing in web applications
- Testing web interfaces with repeated actions
- Automating workflows in Google Sheets
