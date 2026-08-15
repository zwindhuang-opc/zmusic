import Logger from '../utils/logger.js';

const logger = new Logger('Library');

const inMemory = {
  users: new Map(),
  albums: new Map(),
  songs: new Map(),
  sessions: new Map(),
};

export default {
  async register(req, res) {
    try {
      const body = req.body || {};
      const { username, email, password } = body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password required' });
      }
      const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const user = {
        id,
        username: username || email.split('@')[0] || 'User',
        email: String(email).toLowerCase(),
        createdAt: new Date().toISOString(),
      };
      inMemory.users.set(id, user);
      logger.info(`Registered user: ${user.email}`);
      return res.json({ success: true, user });
    } catch (e) {
      logger.error('Register error:', e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  async login(req, res) {
    try {
      const body = req.body || {};
      const { email, password } = body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password required' });
      }
      const emailLc = String(email).toLowerCase();
      let user = Array.from(inMemory.users.values()).find(u => u.email === emailLc);
      if (!user) {
        const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        user = {
          id,
          username: emailLc.split('@')[0] || 'User',
          email: emailLc,
          createdAt: new Date().toISOString(),
        };
        inMemory.users.set(id, user);
      }
      const token = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      inMemory.sessions.set(token, { userId: user.id, createdAt: Date.now() });
      logger.info(`Login: ${user.email}`);
      return res.json({ success: true, user, token });
    } catch (e) {
      logger.error('Login error:', e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  async me(req, res) {
    try {
      const auth = req.headers?.authorization || '';
      const token = auth.replace('Bearer ', '').trim();
      if (!token) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
      const session = inMemory.sessions.get(token);
      if (!session) {
        return res.status(401).json({ success: false, error: 'Session expired' });
      }
      const user = inMemory.users.get(session.userId);
      if (!user) {
        return res.status(401).json({ success: false, error: 'User not found' });
      }
      return res.json({ success: true, user });
    } catch (e) {
      logger.error('Me error:', e);
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  async listAlbums(req, res) {
    try {
      const albums = Array.from(inMemory.albums.values());
      return res.json({ success: true, albums });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  async createAlbum(req, res) {
    try {
      const body = req.body || {};
      const id = body.id || `album-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const album = {
        id,
        owner_id: body.owner_id || 'guest',
        title: body.title || 'Untitled Album',
        description: body.description || '',
        cover_color: body.cover_color || 'from-violet-500 to-pink-500',
        cover_emoji: body.cover_emoji || '🎵',
        tags: body.tags || [],
        is_public: !!body.is_public,
        song_ids: body.song_ids || [],
        share_token: body.share_token || `share-${Math.random().toString(36).slice(2, 12)}`,
        created_at: body.created_at || new Date().toISOString(),
      };
      inMemory.albums.set(id, album);
      return res.json({ success: true, album });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  async listSongs(req, res) {
    try {
      const songs = Array.from(inMemory.songs.values());
      return res.json({ success: true, songs });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  },

  async createSong(req, res) {
    try {
      const body = req.body || {};
      const id = body.id || `song-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const song = {
        id,
        owner_id: body.owner_id || 'guest',
        engine: body.engine || 'unknown',
        engine_task_id: body.engine_task_id || null,
        title: body.title || 'Untitled',
        lyrics: body.lyrics || '',
        style: body.style || '',
        theme: body.theme || '',
        bpm: body.bpm || null,
        duration: body.duration || 0,
        language: body.language || '',
        audio_url: body.audio_url || '',
        cover_data: body.cover_data || null,
        metadata: body.metadata || {},
        favorite: !!body.favorite,
        play_count: body.play_count || 0,
        created_at: body.created_at || new Date().toISOString(),
        publishing_status: body.publishing_status || 'none',
        publishing_result: body.publishing_result || {},
      };
      inMemory.songs.set(id, song);
      return res.json({ success: true, song });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  },
};
