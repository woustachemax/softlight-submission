# Softlight Engineering Take-Home Assignment

## Step 1: Getting Started

Started with a Vite project because I needed TypeScript and React. Created folders for components, types, and scripts. Installed `@figma/rest-api-spec` to get Figma's types, `dotenv` for the API key, and `tsx` to run TypeScript files directly. Made a `.env` file to store my Figma API key and file URL because I didn't want to hardcode credentials. Figured I'd need both a CLI tool for testing and a web interface for the actual submission.

## Step 2: Figma API Client

Built a `FigmaApiClient` class to talk to Figma's API. Added two methods, `getFile()` to grab the whole design file and `getImages()` for rendering specific nodes (didn't end up using this one). Initially used `node-fetch` for the CLI but then realized native `fetch` works fine in Node.js now, so I just removed the `node-fetch` dependency entirely. One less thing to worry about and works in both browser and Node without any separate files.

## Step 3: Type Definitions

Created a massive `types.ts` file with all the Figma data structures. Made interfaces for `FigmaNode`, `Color`, `Fill`, `Stroke`, `Effect`, `BoundingBox`, all that stuff. Figma's API returns a ton of nested data so I needed these types to make sense of it. The types were crucial because without them I'd be accessing random properties and hoping they exist. TypeScript saved me here.

## Step 4: Converting Styles to CSS

Built `StyleGenerator` to turn Figma's visual properties into CSS. Started with `rgbaToString()` because Figma uses 0-1 values but CSS needs 0-255.  Implemented `getBackground()` for solid colors and gradients. The gradient math was annoying,had to calculate angles from Figma's handle positions using `atan2`. Linear gradients worked but I had to figure out the angle conversion. Added `getBorder()` for strokes. Initially tried to respect Figma's stroke alignment (inside vs outsde) by using `content-box` and `border-box`, but that made inputs overflow their containers. Said fuck it and just used `border-box` everywhere. Made `getBorderRadius()` to handle both uniform and per-corner radii. Some elements have `cornerRadius`, others have `rectangleCornerRadii` array. Had to check both. Box shadows were straightforward just map Figma's effects to CSS box-shadow syntax with offset, blur, spread, and color.

## Step 5: Layout System

Created `LayoutGenerator` to convert Figma's auto-layout to flexbox. Checked if a node has `layoutMode`  if it does, it's using auto layout and needs `display: flex`. Mapped Figma's alignment values to CSS `MIN` becomes `flex-start`, `CENTER` is `center`, etc. Grabbed `itemSpacing` and converted it to `gap`.The sizing logic was a mess initially. I tried to be clever about when to set width/height but elements were collapsing or overflowing. Rewrote it to check `primaryAxisSizingMode` and `counterAxisSizingMode` properly. If it's `FIXED`, set the dimension. If there's no layout mode at all, always set both width and height.

## Step 6: Text Was Broken

Text nodes were getting background colors applied to them which looked terrible. The issue was I was treating text like any other node and applying all styles including backgrounds. Split text handling into separate methods  `generateText()` and `generateTextStyles()`. Text nodes only get typography and color, no backgrounds or layout stuff that doesn't make sense for text. Added font loading by collecting all unique fonts during generation and sticking `@import` statements at the top of the CSS. Google Fonts makes this easy.

## Step 7: HTML Generation

Built `HtmlGenerator` as the main class that orchestrates everything. Made a recursive `generateNode()` that walks Figma's tree and spits out HTML divs with unique class names.Class names are generated from node names sanitize the name, add a counter to avoid collisions. Every node gets a unique class like `figma-headline-3`. Collected all the CSS rules in arrays as I traversed the tree, then compiled them into one stylesheet at the end. Added a CSS reset and body centering because I needed the frame centered on the page.

## Step 8: Everything Was Stuck at the Top

Generated the HTML and opened it. everything was crammed at the top of the frame. The home indicator was at the top when it should be at the bottom. Buttons were all wrong. Looked at the terminal output and saw the Y coordinates, home indicator at 831px, sign in at 170px, buttons at 662px, 720px. The frame had no `layoutMode`, so children weren't using autolayout they needed absolute positioning. Rewrote the generator to track parent bounding boxes and calculate absolute positions. If the parent has no layout mode, children get `position: absolute` with `left` and `top` calculated by subtracting parent coordinates from child coordinates. This fixed everything. Elements finally appeared where Figma said they should be.

## Step 9: Text Width Issues

"Forgot password" text wasn't aligned properly. Realized absolutely positioned text nodes need explicit width or they just collapse to content width and `text-align: center` doesn't work right.Added width from `absoluteBoundingBox` to absolutely positioned text elements. Now text spans the full intended width and centers correctly.

## Step 10: CLI Tool for Testing

Made a `scripts/convert.ts` file so I could test quickly without touching the browser. Used `dotenv` to load API key and file URL from `.env`.Added a function to extract the file key from Figma URLs because I was copying full URLs. Supports both `/design/` and `/file/` URL formats.Wired it up, fetch file, grab first frame, generate HTML, write to `output.html`. Added a npm script so I could just run `pnpm convert`. This was way faster for testing than going through the web UI every time. Just run the script, open the HTML, see what broke, fix it, repeat.

## Step 11: Debugging Everything

Added debug logs to see what Figma was actually returning. Logged layout modes, node types, coordinates. This showed me the absolute positioning issue immediately. sKept comparing the generated output to Figma pixel by pixel. Found all these issues: fonts not loading, background color slightly off (Figma returned `#FAFAFA` but I expected `#D9D9D9` turns out the Figma file just had that color), input boxes overflowing because of `content-box`, text getting backgrounds. Fixed each thing one by one. Run convert, check output, find issue, fix code, rpeat. The CLI tool made this loop super fast.

## Step 12: Web Interface

Built the React app in `App.tsx`. Needed a clean UI so I made it match the Softlight site aesthetic with someneutral colors, simple buttons, nothing fancy. Added form inputs for Figma URL and API key. Used the same conversion pipeline as the CLI, create API client, fetch file, extract frame, generate HTML. Made it download the HTML file using `Blob` and `URL.createObjectURL()`. Named the file after the frame name automatically. Added loading states, error messages, success notifications. Threw in instructions on how to get a Figma API token because users would need that.
