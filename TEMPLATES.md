# Story Templates

Lumina Stories now supports saving and loading story templates as YAML files. This allows you to:

- Save your story setup (title, genre, characters, plot outline, etc.) for reuse
- Share templates with others
- Quickly start new stories with pre-configured settings
- Maintain a library of story ideas

## Features

Templates can store the following information:
- **Story Title**: The name of your story
- **Genre**: Fantasy, Sci-Fi, Mystery, Romance, Horror, Thriller, Historical, or Adventure
- **Number of Chapters**: How many chapters you want (1-10)
- **Reading Level**: Elementary, Middle Grade, Young Adult, or Adult
- **Plot Outline**: Your core story idea and plot description
- **Characters**: List of characters with their names and attributes
- **System Prompt** (optional): Custom AI instructions for story generation

## How to Use

### Saving a Template

1. Fill out the story form with your desired settings
2. Click the **"Save"** button in the top-right corner of the form
3. Choose a location and filename (e.g., `my-fantasy-story.yaml`)
4. The template will be saved as a YAML file

### Loading a Template

1. Click the **"Load"** button in the top-right corner of the form
2. Select a previously saved template file (`.yaml` or `.yml`)
3. The form will be automatically populated with the template data
4. You can then modify any fields before generating your story

## Template Format

Templates are saved in YAML format, which is human-readable and easy to edit. Here's an example:

```yaml
# Lumina Stories Template
# Generated: 2026-01-16T00:00:00.000Z

title: "The Last Embers"
genre: "Fantasy"
numChapters: 5
readingLevel: "young-adult"

plotOutline: |
  A lost prince discovers he can manipulate time, but every use ages him a year.
  He must decide whether to save his kingdom from an ancient evil or preserve his own life.

systemPrompt: |
  You are a creative storytelling assistant specializing in Fantasy fiction.
  Write in a vivid, immersive style with rich world-building and character development.

characters:
  - id: "1"
    name: "Prince Aldric"
    attributes: "Brave but reckless, haunted by his past, skilled swordsman"
  - id: "2"
    name: "Sera"
    attributes: "Mysterious wanderer, expert archer, fiercely loyal"
```

## Example Template

An example template (`example-template.yaml`) is included in the project root. You can use it as a starting point or reference for creating your own templates.

## Manual Editing

You can manually edit template files in any text editor. Just make sure to:
- Keep the YAML syntax valid
- Use the correct field names (title, genre, numChapters, readingLevel, plotOutline, characters, systemPrompt)
- Use proper indentation (2 spaces)
- Use the `|` character for multi-line text fields (plotOutline, systemPrompt)

## Browser Compatibility

The template feature uses the File System Access API when available (modern browsers like Chrome, Edge) and falls back to traditional file download/upload for older browsers.

### Supported Browsers:
- **Full support** (File System Access API): Chrome 86+, Edge 86+, Opera 72+
- **Fallback support** (download/upload): Firefox, Safari, and older browsers

## Tips

- Create templates for different genres to quickly start new stories
- Share templates with friends or writing groups
- Use templates to experiment with different story structures
- Keep a library of character archetypes in separate templates
- Combine templates by loading one and then manually adding elements from another

## Troubleshooting

**Template won't load:**
- Make sure the file is a valid YAML file with the correct structure
- Check that all required fields are present (title, genre, numChapters, readingLevel, plotOutline)
- Verify the file extension is `.yaml` or `.yml`

**Characters not loading:**
- Ensure the characters array is properly formatted with id, name, and attributes for each character
- Check indentation (should be 2 spaces per level)

**System prompt not appearing:**
- The system prompt is optional - if not present in the template, the default prompt for the genre will be used
- Make sure to expand the "Advanced Settings" section to see the system prompt

