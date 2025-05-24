// DOM Elements
const notesList = document.getElementById('notes-list');
const editorPlaceholder = document.getElementById('editor-placeholder');
const editorContainer = document.getElementById('editor-container');
const noteTitle = document.getElementById('note-title');
const noteContent = document.getElementById('note-content');
const newNoteBtn = document.getElementById('new-note-btn');
const saveNoteBtn = document.getElementById('save-note-btn');
const deleteNoteBtn = document.getElementById('delete-note-btn');
const searchInput = document.getElementById('search-notes');
const lastEdited = document.getElementById('last-edited');
const themeToggleBtn = document.getElementById('theme-toggle-btn');

// App state
let notes = [];
let activeNoteId = null;

// Initialize app
function initApp() {
    loadNotes();
    renderNotesList();
    setupEventListeners();
    loadTheme(); // Load theme preference on app start
}

// --- Theme Switching Logic ---

function loadTheme() {
    const themePreference = localStorage.getItem('themePreference');
    const iconElement = themeToggleBtn.querySelector('.material-icons');
    if (themePreference === 'dark') {
        document.body.dataset.theme = 'dark';
        if (iconElement) iconElement.textContent = 'brightness_7'; // Sun icon
    } else {
        // Default to light theme
        delete document.body.dataset.theme; // Or document.body.dataset.theme = 'light';
        if (iconElement) iconElement.textContent = 'brightness_4'; // Moon icon
    }
}

function toggleTheme() {
    const iconElement = themeToggleBtn.querySelector('.material-icons');
    if (document.body.dataset.theme === 'dark') {
        // Switch to light theme
        delete document.body.dataset.theme;
        localStorage.setItem('themePreference', 'light');
        if (iconElement) iconElement.textContent = 'brightness_4'; // Moon icon
    } else {
        // Switch to dark theme
        document.body.dataset.theme = 'dark';
        localStorage.setItem('themePreference', 'dark');
        if (iconElement) iconElement.textContent = 'brightness_7'; // Sun icon
    }
}

// --- End Theme Switching Logic ---

// Load notes from localStorage
function loadNotes() {
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
        notes = JSON.parse(savedNotes);
    } else {
        // Create sample note if no notes exist
        const sampleNote = {
            id: generateId(),
            title: 'Welcome to NoteMaster!',
            content: 'This is a simple note-taking app. Create new notes, edit them, and they will be saved automatically.',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        notes = [sampleNote];
        saveNotesToStorage();
    }
}

// Save notes to localStorage
function saveNotesToStorage() {
    localStorage.setItem('notes', JSON.stringify(notes));
}

// Generate unique ID for notes
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Format date to readable string
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get short preview of note content
function getContentPreview(content, maxLength = 60) {
    if (!content) return '';
    return content.length > maxLength 
        ? content.substring(0, maxLength) + '...' 
        : content;
}

// Render notes list
function renderNotesList(searchTerm = '') {
    notesList.innerHTML = '';
    
    const filteredNotes = searchTerm 
        ? notes.filter(note => 
            note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            note.content.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : notes;
    
    // Sort notes by most recently updated
    filteredNotes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    if (filteredNotes.length === 0) {
        notesList.innerHTML = `
            <div class="empty-state">
                <p>${searchTerm ? 'No notes match your search.' : 'No notes yet. Create your first note!'}</p>
            </div>
        `;
        return;
    }
    
    filteredNotes.forEach(note => {
        const noteCard = document.createElement('div');
        noteCard.className = `note-card ${note.id === activeNoteId ? 'active' : ''}`;
        noteCard.dataset.id = note.id;
        
        noteCard.innerHTML = `
            <h3>${note.title || 'Untitled Note'}</h3>
            <p>${getContentPreview(note.content)}</p>
            <div class="date">
                ${formatDate(note.updatedAt)}
            </div>
        `;
        
        noteCard.addEventListener('click', () => selectNote(note.id));
        notesList.appendChild(noteCard);
    });
}

// Select a note
function selectNote(noteId) {
    activeNoteId = noteId;
    const selectedNote = notes.find(note => note.id === noteId);
    
    if (selectedNote) {
        editorPlaceholder.style.display = 'none';
        editorContainer.classList.add('active');
        
        noteTitle.value = selectedNote.title;
        noteContent.value = selectedNote.content;
        lastEdited.textContent = `Last edited: ${formatDate(selectedNote.updatedAt)}`;
        
        // Update active status in the list
        document.querySelectorAll('.note-card').forEach(card => {
            card.classList.toggle('active', card.dataset.id === noteId);
        });
    }
}

// Create a new note
function createNewNote() {
    const newNote = {
        id: generateId(),
        title: '',
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    notes.unshift(newNote);
    saveNotesToStorage();
    renderNotesList();
    selectNote(newNote.id);
    noteTitle.focus();
}

// Save the current note
function saveNote() {
    if (!activeNoteId) return;
    
    const noteIndex = notes.findIndex(note => note.id === activeNoteId);
    if (noteIndex === -1) return;
    
    const updatedNote = {
        ...notes[noteIndex],
        title: noteTitle.value,
        content: noteContent.value,
        updatedAt: new Date().toISOString()
    };
    
    notes[noteIndex] = updatedNote;
    saveNotesToStorage();
    renderNotesList();
    lastEdited.textContent = `Last edited: ${formatDate(updatedNote.updatedAt)}`;
    
    // Show save feedback
    const saveBtn = document.getElementById('save-note-btn');
    saveBtn.innerHTML = '<span class="material-icons">check</span>';
    setTimeout(() => {
        saveBtn.innerHTML = '<span class="material-icons">save</span>';
    }, 1000);
}

// Delete the current note
function deleteNote() {
    if (!activeNoteId) return;
    
    if (confirm('Are you sure you want to delete this note?')) {
        notes = notes.filter(note => note.id !== activeNoteId);
        saveNotesToStorage();
        
        activeNoteId = null;
        editorContainer.classList.remove('active');
        editorPlaceholder.style.display = 'flex';
        renderNotesList();
    }
}

// Handle search
function handleSearch() {
    const searchTerm = searchInput.value.trim();
    renderNotesList(searchTerm);
}

// Set up event listeners
function setupEventListeners() {
    // New note button
    newNoteBtn.addEventListener('click', createNewNote);
    
    // Save note button
    saveNoteBtn.addEventListener('click', saveNote);
    
    // Delete note button
    deleteNoteBtn.addEventListener('click', deleteNote);
    
    // Search input
    searchInput.addEventListener('input', handleSearch);
    
    // Auto-save when typing
    let typingTimer;
    const doneTypingInterval = 1000; // 1 second
    
    const doneTyping = () => {
        if (activeNoteId && (noteTitle.value || noteContent.value)) {
            saveNote();
        }
    };
    
    noteTitle.addEventListener('input', () => {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(doneTyping, doneTypingInterval);
    });
    
    noteContent.addEventListener('input', () => {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(doneTyping, doneTypingInterval);
    });
    
    // Theme toggle button
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveNote();
        }
        
        // Ctrl/Cmd + N for new note
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            createNewNote();
        }
    });
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp); 