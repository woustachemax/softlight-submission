# Softlight Engineering Take-Home Assignment

> Built a tool that converts Figma designs int HTML/CSS. Takes a Figma file URL and API key, outputs a standalone HTML file with embedded CSS that matches the original design exactly.

## Features

- Converts Figma frames to HTML/CSS with accurate positioning, spacing, and styling
- Handles auto-layout (flexbox) and absolute positioning
- Supports gradients, shadows, borders, and custom typography
- Automatically loads Google Fonts
- Available as both CLI tool and web interface
- Zero dependencies in generated HTML (pure CSS)

## Setup

Install dependencies:

```bash
pnpm install
```

Create a `.env` file in the project root:

```env
FIGMA_API_KEY=your_figma_api_key_here
FIGMA_FILE_KEY=your_figma_file_url_here
```

### Getting Your Figma API Key

1. Go to [Figma Account Settings](https://www.figma.com/settings)
2. Scroll to "Personal Access Tokens"
3. Click "Create a new personal access token"
4. Copy the token and add it to `.env`

### Getting Your Figma File URL

1. Open your Figma file
2. Copy the URL from your browser
3. Add the full URL to `.env` (the tool will extract the file key automatically)

## Usage

### CLI (Recommended for Development)

The CLI tool is faster for testing and iteration. See [Step 10 in process.md](./process.md#step-10-cli-tool-for-testing) for implementation details.

```bash
pnpm convert
```

This will:
- Read credentials from `.env`
- Fetch the Figma file
- Convert the first frame
- Output to `output.html`

Optional: specify custom output file

```bash
pnpm convert custom-name.html
```

### Web Interface

Start the development server:

```bash
pnpm dev
```

Open `http://localhost:5173` and:
1. Paste your Figma file URL
2. Enter your API key
3. Click "Convert & Download"

The HTML file will download automatically.

## How It Works

The converter follows a multi-step pipeline documented in [process.md](./process.md):

1. **Fetches design data** from Figma's REST API ([Step 2](./process.md#step-2-figma-api-client))
2. **Parses the node tree** with full TypeScript types ([Step 3](./process.md#step-3-type-definitions))
3. **Converts styles** - colors, gradients, borders, shadows ([Step 4](./process.md#step-4-converting-styles-to-css))
4. **Handles layout** - auto-layout (flexbox) or absolute positioning ([Step 5](./process.md#step-5-layout-system), [Step 8](./process.md#step-8-everything-was-stuck-at-the-top))
5. **Processes text** - typography, alignment, font loading ([Step 6](./process.md#step-6-text-was-broken))
6. **Generates HTML** - unique classes, embedded CSS ([Step 7](./process.md#step-7-html-generation))

### Key Design Decisions

**Absolute vs Flexbox Positioning**: Frames without auto-layout use absolute positioning based on Figma's coordinates. Frames with auto-layout convert to CSS flexbox. See [Step 8](./process.md#step-8-everything-was-stuck-at-the-top) for why this matters.

**Border Box Everything**: Initially tried to respect Figma's stroke alignment (inside vs outside) but it caused overflow issues. Switched to `border-box` universally. Details in [Step 4](./process.md#step-4-converting-styles-to-css).

**Text Width for Centering**: Absolutely positioned text needs explicit width or `text-align: center` breaks. Fixed in [Step 9](./process.md#step-9-text-width-issues).

## Project Structure

```
softlight-submission/
├── src/
│   ├── components/
│   │   ├── figma-api.ts         
│   │   ├── html-generator.ts    
│   │   ├── layout-generator.ts  
│   │   └── style-generator.ts
│   ├── types/
│   │   └── types.ts
│   └── App.tsx                  
├── scripts/
│   └── convert.ts
├── .env
├── output.html
└── process.md                   
```

## Development

The CLI tool was essential for rapid iteration ([Step 10](./process.md#step-10-cli-tool-for-testing)). The typical development loop:

1. Make code changes
2. Run `pnpm convert`
3. Open `output.html` in browser
4. Compare to Figma design
5. Identify issues with debug logs ([Step 11](./process.md#step-11-debugging-everything))
6. Repeat

Debug mode (shows Figma data structure):

```bash
pnpm convert
```

The script already includes helpful logs about layout modes, coordinates, and node types.

## Limitations

- Only converts the first frame of the first page
- Images are not exported (would require additional API calls)
- Blend modes other than NORMAL are not supported
- Component instances are flattened (not interactive)
- Text editing/input functionality is not preserved

## Troubleshooting

**"Invalid Figma URL"**: Make sure you're using the full URL from your browser, including `https://www.figma.com/design/...`

**"Figma API error"**: Check that your API key is valid and the file is accessible with that token

**Colors look wrong**: Figma might be returning slightly different colors than expected. Check the debug logs to see actual RGB values.

**Layout is broken**: Make sure the frame has proper bounding boxes. Frames without dimensions can't be positioned correctly.

## Tech Stack

- **Vite** - Build tool and dev server
- **TypeScript** - Type safety throughout
- **React** - Web interface
- **Figma REST API** - Design data source
- **Native Fetch** - API requests (works in both Node and browser, see [Step 2](./process.md#step-2-figma-api-client))
