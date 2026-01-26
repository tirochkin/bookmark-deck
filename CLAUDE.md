# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Bookmark Deck** is a visual bookmark manager inspired by Stream Deck XL. Single-page web application for organizing bookmarks in an 8×4 grid format (32 cells per page).

**Status**: Pre-development (specification complete at `/docs/bookmark-deck-tz.md`)

## Work Tracking

Файл `/work.md` используется как память текущего состояния разработки:
- Пошаговый план реализации с чекбоксами
- Текущий этап и следующие шаги
- Выполненные задачи
- Технические заметки и решения

**Перед началом работы** — прочитай work.md для понимания текущего состояния.
**После завершения задачи** — обнови work.md (отметь выполненное, добавь заметки).

## Technology Stack

- **Framework**: Vue.js 3 (Composition API)
- **Styling**: Tailwind CSS 4
- **State Management**: Pinia
- **Data Storage**: localStorage only (no backend)
- **Build Tool**: Vite
- **Target**: Desktop browsers (Chrome, Firefox, Safari, Edge)

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server (localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Architecture

### Core Concepts

- **Grid**: Fixed 8×4 layout (32 cells) - does not adapt to screen size
- **Tabs**: 1-8 pages of bookmarks, each with its own grid
- **Blocks**: Individual bookmarks with URL, title, color, text alignment
- **Edit Mode**: Toggle that enables all modification operations
- **Buffer**: Temporary block storage (visible only in edit mode)
- **Trash**: Deleted items with recovery option (edit mode only)

### Data Model (localStorage key: `bookmarkDeck`)

```json
{
  "version": "1.0",
  "tabs": [{
    "id": "uuid",
    "name": "Tab Name",
    "order": 0,
    "blocks": [{
      "id": "uuid",
      "position": { "row": 0, "col": 0 },
      "url": "https://example.com",
      "title": "Example",
      "color": "gradient-cyan-purple",
      "icon": null,
      "textAlign": "center"
    }]
  }],
  "buffer": [],
  "trash": { "blocks": [], "tabs": [] }
}
```

### Recommended Component Structure

```
src/
├── components/
│   ├── layout/      # AppHeader, AppFooter
│   ├── tabs/        # TabBar, TabItem, TabCreateButton
│   ├── grid/        # BookmarkGrid, BookmarkCell, BookmarkBlock
│   ├── buffer/      # BufferArea, TrashBin
│   ├── modals/      # BlockEditModal, TabEditModal, ConfirmModal, ImportExportModal
│   ├── ui/          # ColorPalette, IconSelector, ContextMenu, AlignmentPicker
│   └── common/      # DraggableBlock
├── composables/     # useStorage, useDragDrop, useClipboard, useEditMode
├── stores/          # bookmarkStore.js (Pinia)
├── utils/           # validators, exportImport, colors
└── App.vue
```

## Design System

- **Theme**: Dark only (near-black background)
- **Style**: Gaming/neon aesthetic inspired by Stream Deck
- **Colors**: Deep tones (dark blue, purple, emerald) + neon accents (cyan, magenta, lime, orange)
- **Effects**: Glow on hover, smooth transitions
- **Palette**: 12-16 preset colors/gradients for blocks

## Key Interactions

### Normal Mode
- Click block → opens URL in new browser tab

### Edit Mode
- Click block/empty cell → opens create/edit modal
- Drag block to empty cell → moves block
- Drag block to occupied cell → context menu (swap/buffer/delete/cancel)
- Ctrl+click block → copy
- Shift+click block → cut
- Ctrl+click empty cell → paste

## Validation Rules

- URL: Required, valid URL format
- Title: Required, max 50 characters
- Color: Required, from preset palette
- Text alignment: Required (top/center/bottom), default: center
- Grid position: columns 0-7, rows 0-3
- Tab name: Required, max 50 characters
- Tab count: 1-8 (last tab cannot be deleted)

## Implementation Notes

- Debounce localStorage saves (300-500ms)
- Include `version` field in data for future migrations
- Validate data structure on load, fallback to defaults if corrupted
- Target 60fps animations using transform/opacity

## Deferred Features (not in v1)

- Icon selector (field reserved but unused)
- Search functionality
- Browser bookmark import
- Cloud sync
- Light theme
- Mobile adaptation
