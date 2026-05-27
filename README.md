# Danh sách chờ 🎬

A simple and elegant web application for managing your game, movie, and comic backlog. Keep track of everything you want to enjoy later with a clean, user-friendly interface.

## Features ✨

- **Quick Add**: Add items one at a time with instant validation and a tag selector
- **Bulk Import**: Add multiple items at once (separated by new lines or commas) with a summary of what was added or skipped
- **Smart Formatting**: Automatically formats item titles to title case with proper Vietnamese locale support
- **URL Cleanup**: Removes stray links from pasted text and can extract titles or IDs from supported links
- **Duplicate Detection**: Prevents the same item with the same tag from being added twice
- **Persistent Storage**: Your watchlist is saved automatically to browser localStorage
- **Sorted List**: Movies are automatically sorted alphabetically
- **Dark Theme**: Modern dark UI with smooth gradients
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Vietnamese Support**: Full Vietnamese language support with proper text localization

## How to Use 🚀

1. **Clone or download** this repository to your local machine
2. **Open** `index.html` in your web browser
3. **Start adding items!**

### Adding Movies

#### Single Item

1. Enter the item name in the "Thêm nhanh" (Quick Add) field
2. Click the "Thêm" (Add) button or press Enter
3. Pick a tag: Game, Movie, or Comic
4. You'll see a confirmation message

If you paste extra links in the same input, the app will try to clean them automatically before saving.

Examples:

- `https://nhentai.net/g/299334/` becomes `299334`
- `https://vlogtruyen.net/toi-la-tan-thu-co-cap-cao-nhat/chapter-1-6103a887f8fac801c76971c5.html` becomes `Tôi Là Tân Thủ Có Cấp Cao Nhất`

#### Multiple Items

1. Go to the "Nhập nhiều" (Bulk Import) section
2. Paste or type multiple item names, each on a new line or separated by commas
3. Choose one tag for the whole batch
4. Click "Thêm tất cả" (Add All) button
5. The app will show a short summary of how many items were added, skipped as duplicates, or ignored as empty entries

### Managing Your List

- View your complete item list with an automatic count
- Click the "×" button next to any item to delete it
- Your changes are saved automatically

## Project Structure 📁

```
watch-later/
├── index.html      # HTML structure and layout
├── style.css       # Styling and design
├── app.js          # JavaScript logic and functionality
└── README.md       # This file
```

## Technical Details 🛠️

- **Language**: Vanilla JavaScript (no frameworks)
- **Storage**: Browser localStorage API
- **Styling**: Custom CSS with modern design patterns
- **Accessibility**: Semantic HTML with ARIA labels
- **Localization**: Vietnamese locale support (vi-VN)

## Browser Compatibility 🌐

Works in all modern browsers:

- Chrome/Chromium
- Firefox
- Safari
- Edge

## Features Explained 📝

### Smart Text Processing

- Removes extra spaces automatically
- Handles multiple whitespace properly
- Converts to proper title case in Vietnamese
- Cleans pasted URLs from mixed input
- Extracts readable text from supported links when possible

### Duplicate Prevention

- Case-insensitive matching
- Accent-insensitive comparison
- Prevents adding the same item twice under the same tag

### Data Persistence

- Uses browser localStorage
- Automatically saves on every change
- Loads your list when you return

## Customization 🎨

You can customize the app by editing:

- **Colors**: Change CSS variables in `style.css` (`:root` section)
- **Language**: Update Vietnamese strings in `index.html` and `app.js`
- **Styling**: Modify CSS classes in `style.css`

## License 📄

Feel free to use this project for personal or commercial purposes.

## Tips 💡

- Use comma-separated values or new lines when bulk importing
- Movie titles are automatically formatted consistently
- Refresh the page - your list will still be there!
- Clear your browser's localStorage if you want to start fresh

---

**Enjoy managing your watchlist! 🍿**
