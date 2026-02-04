# Watch Later 🎬

A simple and elegant web application for managing your movie watchlist. Keep track of all the movies you want to watch with a clean, user-friendly interface.

## Features ✨

- **Quick Add**: Add movies one at a time with instant validation
- **Bulk Import**: Add multiple movies at once (separated by new lines or commas)
- **Smart Formatting**: Automatically formats movie titles to title case with proper Vietnamese locale support
- **Duplicate Detection**: Prevents the same movie from being added twice
- **Persistent Storage**: Your watchlist is saved automatically to browser localStorage
- **Sorted List**: Movies are automatically sorted alphabetically
- **Dark Theme**: Modern dark UI with smooth gradients
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Vietnamese Support**: Full Vietnamese language support with proper text localization

## How to Use 🚀

1. **Clone or download** this repository to your local machine
2. **Open** `index.html` in your web browser
3. **Start adding movies!**

### Adding Movies

#### Single Movie

1. Enter the movie name in the "Thêm nhanh" (Quick Add) field
2. Click the "Thêm" (Add) button or press Enter
3. You'll see a confirmation message

#### Multiple Movies

1. Go to the "Nhập nhiều" (Bulk Import) section
2. Paste or type multiple movie names, each on a new line or separated by commas
3. Click "Thêm tất cả" (Add All) button
4. Duplicates will be automatically skipped

### Managing Your List

- View your complete movie list with an automatic count
- Click the "×" button next to any movie to delete it
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

### Duplicate Prevention

- Case-insensitive matching
- Accent-insensitive comparison
- Prevents adding the same movie twice

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
