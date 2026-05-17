const updateService = require('../services/updateService');


/* =========================================================
   🟩 VIEW DAIRY PROJECTS
========================================================= */
exports.viewDairyProjects = async (req, res) => {
  try {
    const dairies = await updateService.getPositiveDairies();

    res.render('dairyProjects', {
      title: 'Dairy Projects',
      dairies,
      user: req.session.user || null
    });

  } catch (err) {
    console.error('VIEW DAIRY PROJECTS ERROR:', err.message);
    res.status(500).send('Failed to load dairy projects');
  }
};


/* =========================================================
   🟦 VIEW STRUCTURES
========================================================= */
exports.viewStructures = async (req, res) => {
  try {
    const dairies = await updateService.getNegativeDairies();

    res.render('structures', {
      title: 'Structures',
      dairies,
      user: req.session.user || null
    });

  } catch (err) {
    console.error('VIEW STRUCTURES ERROR:', err.message);
    res.status(500).send('Failed to load structures');
  }
};


/* =========================================================
   🟨 VIEW PROFILE PAGE
========================================================= */
exports.viewPage = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await updateService.getDairyPage(id);

    res.render('update', {
      title: 'Dairy Profile',

      dairy: data.dairy,
      feed: data.feed || [],
      weeklyFeed: data.weeklyFeed || null,

      commentCount: data.commentCount,
      user: req.session.user || null
    });

  } catch (err) {
    console.error('VIEW PAGE ERROR:', err.message);
    res.status(500).send('Failed to load dairy profile');
  }
};


/* =========================================================
   🟩 GENERAL COMMENT
========================================================= */
exports.comment = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;
    const comment = req.body.comment?.trim();

    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (!comment) return res.status(400).json({ error: 'Comment cannot be empty' });

    const saved = await updateService.addComment({
      dairyId: id,
      userId: user._id,
      comment
    });

    const payload = {
      _id: saved._id,
      comment: saved.comment,
      userName: user.name,
      userImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
      dateText: new Date(saved.createdAt).toLocaleString()
    };

    const io = req.app.get('io');
    if (io) io.to(id).emit('commentAdded', payload);

    return res.json(payload);

  } catch (err) {
    console.error('COMMENT ERROR:', err.message);
    res.status(500).json({ error: 'Failed to post comment' });
  }
};


/* =========================================================
   🟦 UPDATE IMAGE
========================================================= */
exports.image = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    if (!user) return res.status(401).send('Unauthorized');
    if (!req.file) return res.status(400).send('No image uploaded');

    await updateService.updateImage({
      dairyId: id,
      userId: user._id,
      image: req.file.filename
    });

    const payload = {
      dairyId: id,
      image: `/uploads/${req.file.filename}`,
      userName: user.name,
      dateText: new Date().toLocaleString()
    };

    const io = req.app.get('io');
    if (io) io.to(id).emit('imageUpdated', payload);

    res.redirect(`/dairy/${id}`);

  } catch (err) {
    console.error('IMAGE UPDATE ERROR:', err.message);
    res.status(500).send('Failed to update image');
  }
};


/* =========================================================
   � CREATE POST
========================================================= */
exports.createPost = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;
    const text = req.body.text?.trim();
    const image = req.file?.filename || null;

    if (!user) return res.status(401).send('Unauthorized');
    if (!text && !image) return res.status(400).send('Post text or image required');

    const post = await updateService.createPost({
      dairyId: id,
      userId: user._id,
      userName: user.name,
      text,
      image
    });

    const payload = {
      _id: post._id,
      userId: user._id,
      userName: user.name,
      userImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
      text: post.text || '',
      image: post.image || null,
      likes: 0,
      comments: [],
      createdAt: post.createdAt,
      dateText: new Date(post.createdAt).toLocaleString()
    };

    const io = req.app.get('io');
    if (io) io.to(id).emit('postCreated', payload);

    res.redirect(`/dairy/${id}`);
  } catch (err) {
    console.error('CREATE POST ERROR:', err.message);
    res.status(500).send('Failed to create post');
  }
};


/* =========================================================
   🟦 LIKE / UNLIKE POST
========================================================= */
exports.likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    if (!user) return res.status(401).send('Unauthorized');

    const result = await updateService.toggleLike({
      postId: id,
      userId: user._id
    });

    const io = req.app.get('io');
    if (io) io.to(req.body.dairyId || id).emit('postLiked', {
      postId: id,
      likes: result.likes
    });

    res.json({ likes: result.likes, liked: result.liked });
  } catch (err) {
    console.error('LIKE POST ERROR:', err.message);
    res.status(500).send('Failed to like/unlike post');
  }
};


/* =========================================================
   💬 ADD COMMENT TO POST
========================================================= */
exports.addPostComment = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;
    const text = req.body.text?.trim();

    if (!user) return res.status(401).send('Unauthorized');
    if (!text) return res.status(400).send('Comment text required');

    const comment = await updateService.addPostComment({
      postId: id,
      userId: user._id,
      userName: user.name,
      text
    });

    const payload = {
      postId: id,
      comment: {
        _id: comment._id,
        userId: user._id,
        userName: user.name,
        userImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
        text: comment.text,
        dateText: new Date(comment.createdAt).toLocaleString()
      }
    };

    const io = req.app.get('io');
    if (io) io.to(req.body.dairyId || req.params.dairyId || 'all').emit('postCommentAdded', payload);

    res.json(payload);
  } catch (err) {
    console.error('ADD POST COMMENT ERROR:', err.message);
    res.status(500).send('Failed to add comment');
  }
};


/* =========================================================
   🗑 DELETE POST
========================================================= */
exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    if (!user) return res.status(401).send('Unauthorized');

    await updateService.deletePost({ postId: id, user });

    const io = req.app.get('io');
    if (io) io.to(req.body.dairyId || req.params.dairyId || 'all').emit('postDeleted', { postId: id });

    res.json({ success: true });
  } catch (err) {
    console.error('DELETE POST ERROR:', err.message);
    res.status(500).send('Failed to delete post');
  }
};


/* =========================================================
   ❌ DELETE COMMENT
========================================================= */
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    if (!user) return res.status(401).send('Unauthorized');

    await updateService.deleteComment({ commentId: id, user });

    const io = req.app.get('io');
    if (io) io.to(req.body.dairyId || req.params.dairyId || 'all').emit('commentDeleted', {
      commentId: id,
      postId: req.body.postId
    });

    res.json({ success: true });
  } catch (err) {
    console.error('DELETE COMMENT ERROR:', err.message);
    res.status(500).send('Failed to delete comment');
  }
};


/* =========================================================
   �🟥 MEDICAL - MARK
========================================================= */
exports.markMedical = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    if (!user) return res.status(401).send('Unauthorized');

    if (user.role !== 'dairyWorker') {
      return res.status(403).send('Only dairy workers can mark medical attention');
    }

    const type = req.body.type?.trim();
    const details = req.body.details?.trim();

    if (!type || !details) {
      return res.status(400).send('Medical type and details required');
    }

    const updated = await updateService.markMedicalAttention({
      dairyId: id,
      userId: user._id,
      type,
      details
    });

    const payload = {
      dairyId: id,
      status: 'marked',
      type,
      details,
      userName: user.name,
      userImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
      dateText: new Date(updated.medical.markedAt).toLocaleString()
    };

    const io = req.app.get('io');
    if (io) io.to(id).emit('medicalMarked', payload);

    res.redirect(`/dairy/${id}`);

  } catch (err) {
    console.error('MEDICAL MARK ERROR:', err.message);
    res.status(500).send('Failed to mark medical attention');
  }
};


/* =========================================================
   🟪 MEDICAL - UNMARK (ADMIN + CHARGES + DESCRIPTION)
========================================================= */
exports.unmarkMedical = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    if (!user) return res.status(401).send('Unauthorized');

    if (user.role !== 'admin') {
      return res.status(403).send('Only admin can unmark medical attention');
    }

    const charges = Number(req.body.charges);
    const description = req.body.description?.trim();

    if (isNaN(charges) || charges < 0) {
      return res.status(400).send('Valid charges required');
    }

    if (!description) {
      return res.status(400).send('Description required');
    }

    const updated = await updateService.unmarkMedicalAttention({
      dairyId: id,
      userId: user._id,
      charges,
      description
    });

    const payload = {
      dairyId: id,
      status: 'cleared',
      charges,
      description,
      clearedBy: user.name,
      dateText: new Date(updated.createdAt).toLocaleString()
    };

    const io = req.app.get('io');
    if (io) io.to(id).emit('medicalUnmarked', payload);

    res.redirect(`/dairy/${id}`);

  } catch (err) {
    console.error('MEDICAL UNMARK ERROR:', err.message);
    res.status(500).send('Failed to unmark medical attention');
  }
};


/* =========================================================
   🟩 MAINTENANCE - MARK
========================================================= */
exports.markMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    if (!user) return res.status(401).send('Unauthorized');

    if (!(user.role === 'admin' || user.role === 'dairyWorker')) {
      return res.status(403).send('Not allowed');
    }

    const type = req.body.type?.trim();
    const description = req.body.description?.trim();

    if (!type || !description) {
      return res.status(400).send('Type and description required');
    }

    const update = await updateService.markMaintenance({
      dairyId: id,
      userId: user._id,
      type,
      description
    });

    const payload = {
      dairyId: id,
      status: 'marked',
      type,
      description,
      userName: user.name,
      dateText: new Date(update.createdAt).toLocaleString()
    };

    const io = req.app.get('io');
    if (io) io.to(id).emit('maintenanceMarked', payload);

    res.redirect(`/dairy/${id}`);

  } catch (err) {
    console.error('MAINTENANCE MARK ERROR:', err.message);
    res.status(500).send('Failed to mark maintenance');
  }
};


/* =========================================================
   🟦 MAINTENANCE - CLEAR
========================================================= */
exports.clearMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    if (!user) return res.status(401).send('Unauthorized');
    if (user.role !== 'admin') {
      return res.status(403).send('Only admin can clear maintenance');
    }

    const charges = Number(req.body.charges);
    const description = req.body.description?.trim();

    if (isNaN(charges) || charges < 0) {
      return res.status(400).send('Valid charges required');
    }

    if (!description) {
      return res.status(400).send('Description required');
    }

    const update = await updateService.clearMaintenance({
      dairyId: id,
      userId: user._id,
      charges,
      description
    });

    const payload = {
      dairyId: id,
      status: 'cleared',
      charges,
      description,
      userName: user.name,
      dateText: new Date(update.createdAt).toLocaleString()
    };

    const io = req.app.get('io');
    if (io) io.to(id).emit('maintenanceCleared', payload);

    res.redirect(`/dairy/${id}`);

  } catch (err) {
    console.error('MAINTENANCE CLEAR ERROR:', err.message);
    res.status(500).send('Failed to clear maintenance');
  }
};


/* =========================================================
   🟦 POSTS SYSTEM (UNCHANGED)
========================================================= */
// (kept exactly as your version — no edits needed)