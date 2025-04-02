# Slap News

## Overview

This client-side JavaScript web application provides personalized news updates through an intuitive, modern interface. It allows users to customize their news feed by selecting categories of interest, bookmark articles for later reading, and switch between light and dark themes for comfortable reading.

Developed for the BCIT COMP 1800 course, applying modern web development practices, integrating the News API for real-time news content, and Firebase for user authentication and data persistence.

---

## Features

- Personalized news feed based on user-selected categories
- Infinite scroll with dynamic article loading
- Bookmark system for saving articles
- Dark/Light theme toggle
- Responsive design for desktop and mobile
- User authentication with Firebase
- Category-based news filtering
- Real-time news updates from multiple sources

---

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: 
  - Firebase for authentication and data storage
  - Custom Node.js proxy server (deployed on Render) for News API integration
- **Database**: Firebase Firestore
- **APIs**: 
  - News API for article content
  - Firebase Authentication
  - Firebase Firestore

---

## Usage

1. Visit the deployed application at [Netlify URL]
2. Sign in using your Google account or email
3. Select your preferred news categories
4. Browse articles and bookmark your favorites
5. Customize your experience through settings

---

## Project Structure

```
slap-news/
├── index.html
├── main.html
├── categories.html
├── bookmarks.html
├── profile.html
├── settings.html
├── styles/
│   ├── styles.css
│   ├── main-styles.css
│   ├── categories-styles.css
│   ├── bookmarks-styles.css
│   ├── profile-styles.css
│   ├── settings-styles.css
│   └── signin-styles.css
└── scripts/
    ├── newsAPI.js
    ├── authentication.js
    ├── categories.js
    ├── bookmarks.js
    ├── profile.js
    ├── settings.js
    └── theme.js
```

---

## Contributors

- **Nathan Hong** - BCIT CST Student with experience in html, css, javascript, lua, and python. Plays the guitar as a hobby.
- **Senuk** - BCIT CST Student, Valorant player, was immortal.
- Senuk - BCIT CST Student with a passion for creating user-friendly applications. Fun fact: Loves playing FPS games.
- **Alon** - BCIT CST Student, new to the coding world. Interest include music, DJing and being outdoors.

---

## Acknowledgments

- News data sourced from [News API](https://newsapi.org/)
- Icons from [Font Awesome](https://fontawesome.com/)
- Profile images from [Unsplash](https://unsplash.com/)
- Firebase documentation and examples
- Course materials and guidance from BCIT COMP 1800

---

## Limitations and Future Work

### Limitations

- News API free tier has a daily request limit
- Limited to news from selected countries
- No offline support for saved articles
- No social sharing features
- No comment system for articles

### Future Work

- Implement offline support for bookmarked articles
- Add social sharing capabilities
- Create a comment system for articles
- Add user preferences for news sources
- Implement push notifications for breaking news
- Add article search functionality
- Create a mobile app version

---

## License


This project is licensed under the MIT License. See the LICENSE file for details.
