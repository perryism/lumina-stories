# Local Model Selector Feature

## Overview

The LOCAL_MODEL environment variable now supports a comma-delimited list of models, and a dropdown UI has been added to the header to allow users to switch between available local models on the fly.

## Changes Made

### 1. Environment Configuration Updates

**Files Modified:**
- `.env.example`
- `.env.local.example`

**Changes:**
- Updated `LOCAL_MODEL` to accept comma-delimited lists
- Added comments explaining the new format
- Updated examples to show multiple models

**Example:**
```env
LOCAL_MODEL=mistral-7b-instruct,llama-3-8b-instruct,codellama-7b
```

### 2. Model Selection Utility

**New File:** `utils/modelSelection.ts`

**Functions:**
- `getAvailableModels()` - Parses LOCAL_MODEL env var into array of model names
- `getSelectedModel()` - Gets currently selected model from localStorage
- `setSelectedModel(modelName)` - Saves selected model to localStorage
- `hasMultipleModels()` - Checks if multiple models are available
- `isLocalProvider()` - Checks if using local AI provider
- `getAIProvider()` - Gets the current AI provider

**Features:**
- Automatically falls back to first model if none selected
- Validates model selection against available models
- Uses localStorage for persistence across sessions

### 3. Layout Component Updates

**File Modified:** `components/Layout.tsx`

**Changes:**
- Added model selector dropdown in desktop navigation
- Added model selector in mobile menu
- Only displays when:
  - AI_PROVIDER is set to "local"
  - Multiple models are available in LOCAL_MODEL
- Reloads page when model is changed to apply new selection

**UI Location:**
- Desktop: Between "Templates" and "New Story" buttons
- Mobile: In the mobile menu dropdown

### 4. AI Service Updates

**File Modified:** `services/aiService.ts`

**Changes:**
- Added import for `getSelectedModel` utility
- Created `getLocalModel()` helper function that:
  - Checks for task-specific models first (LOCAL_MODEL_OUTLINE, etc.)
  - Falls back to user-selected model from UI
- Updated MODELS.local to use getter functions instead of static values
- All AI operations now use the selected model dynamically

**Backward Compatibility:**
- Task-specific models (LOCAL_MODEL_OUTLINE, LOCAL_MODEL_CHAPTER, LOCAL_MODEL_SUMMARY) still work
- Single model in LOCAL_MODEL still works (no dropdown shown)
- Default fallback to "local-model" if nothing configured

## Usage

### Basic Setup (Single Model)

```env
AI_PROVIDER=local
LOCAL_API_URL=http://localhost:1234/v1
LOCAL_MODEL=mistral-7b-instruct
```

No dropdown will appear - the single model is used automatically.

### Multi-Model Setup

```env
AI_PROVIDER=local
LOCAL_API_URL=http://localhost:1234/v1
LOCAL_MODEL=mistral-7b-instruct,llama-3-8b-instruct,codellama-7b
```

A dropdown will appear in the header allowing you to switch between models.

### Advanced: Task-Specific Models

```env
AI_PROVIDER=local
LOCAL_API_URL=http://localhost:1234/v1
LOCAL_MODEL=mistral-7b-instruct,llama-3-8b-instruct
LOCAL_MODEL_OUTLINE=mistral-7b-instruct
LOCAL_MODEL_CHAPTER=llama-3-70b-instruct
LOCAL_MODEL_SUMMARY=mistral-7b-instruct
```

Task-specific models take precedence over the UI selection.

## User Experience

1. **First Visit**: The first model in the list is used by default
2. **Model Selection**: User selects a different model from dropdown
3. **Page Reload**: Page automatically reloads to apply the new model
4. **Persistence**: Selection is saved in localStorage and persists across sessions
5. **Validation**: Only models in the LOCAL_MODEL list can be selected

## Technical Details

### Model Selection Priority

For each AI operation, the model is selected in this order:
1. Task-specific environment variable (LOCAL_MODEL_OUTLINE, etc.)
2. User-selected model from UI (stored in localStorage)
3. First model in LOCAL_MODEL list
4. Default fallback: "local-model"

### Storage

- Selected model is stored in localStorage with key: `lumina-selected-local-model`
- Survives page reloads and browser restarts
- Automatically validates against current LOCAL_MODEL list

### UI Visibility

The model selector dropdown only appears when:
- `AI_PROVIDER=local` in environment
- `LOCAL_MODEL` contains multiple comma-separated models
- Both conditions must be true

## Testing

To test the feature:

1. Set up your `.env` file with multiple models:
   ```env
   AI_PROVIDER=local
   LOCAL_API_URL=http://localhost:1234/v1
   LOCAL_MODEL=model1,model2,model3
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Look for the "Model:" dropdown in the header

4. Select a different model - the page will reload

5. Verify the new model is being used in AI operations

## Future Enhancements

Potential improvements:
- Show model capabilities/descriptions in dropdown
- Add model performance indicators
- Allow model switching without page reload
- Per-story model preferences
- Model usage statistics

