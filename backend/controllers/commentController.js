const Comment = require('../models/comment');

// Lấy bình luận theo sản phẩm (phân trang)
exports.getCommentsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { productId, isApproved: true, replyTo: null };
    const total = await Comment.countDocuments(filter);
    let comments = await Comment.find(filter)
      .populate('userId', 'fullName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    comments = comments.map(comment => {
      const obj = comment.toObject();
      if (obj.userId) {
        obj.user = obj.userId;
        delete obj.userId;
      } else {
        obj.user = null;
      }
      return obj;
    });

    res.json({ comments, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Tạo bình luận mới (có hỗ trợ ảnh và reply)
exports.createComment = async (req, res) => {
  try {
    const { productId, content, replyTo } = req.body;
    const userId = req.user ? req.user._id : null;
    const userNameFromBody = req.body.userName;
    const finalUserName = req.user
      ? req.user.fullName
      : (userNameFromBody && userNameFromBody.trim() ? userNameFromBody : 'Khách');

    const images = req.files ? req.files.map(file => `/uploads/comments/${file.filename}`) : [];

    const newComment = new Comment({
      productId,
      userId,
      userName: finalUserName,
      content,
      images,
      rating: 5,
      replyTo: replyTo || null,
      isApproved: true,
    });
    await newComment.save();

    if (replyTo) {
      await Comment.findByIdAndUpdate(replyTo, { $inc: { replyCount: 1 } });
    }

    await newComment.populate('userId', 'fullName avatar');

    // Transform: userId -> user
    const commentObj = newComment.toObject();
    if (commentObj.userId) {
      commentObj.user = commentObj.userId;
      delete commentObj.userId;
    } else {
      commentObj.user = null;
    }

    res.status(201).json(commentObj);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Lấy danh sách replies của một comment
exports.getReplies = async (req, res) => {
  try {
    const { commentId } = req.params;
    let replies = await Comment.find({ replyTo: commentId, isApproved: true })
      .populate('userId', 'fullName avatar')
      .sort({ createdAt: 1 });

    replies = replies.map(reply => {
      const obj = reply.toObject();
      if (obj.userId) {
        obj.user = obj.userId;
        delete obj.userId;
      } else {
        obj.user = null;
      }
      return obj;
    });

    res.json(replies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Thả cảm xúc (like)
exports.reactToComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { type } = req.body;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Không tìm thấy bình luận' });

    if (!comment.reactions) comment.reactions = { like: [] };
    if (type === 'like') {
      const index = comment.reactions.like.findIndex(id => id.toString() === userId.toString());
      if (index === -1) comment.reactions.like.push(userId);
      else comment.reactions.like.splice(index, 1);
    }
    await comment.save();
    res.json({ reactions: comment.reactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: lấy tất cả bình luận (phân trang, tìm kiếm, filter status)
// ADMIN: lấy tất cả bình luận (phân trang, tìm kiếm, filter status)
exports.getAllCommentsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';

    let filter = {};
    if (search) {
      filter.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }
    if (status === 'active') filter.isApproved = true;
    else if (status === 'hidden') filter.isApproved = false;

    const comments = await Comment.find(filter)
      .populate('productId', 'name slug')
      .populate('userId', 'email fullName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Chuyển đổi cấu trúc: userId -> user
    const formatted = comments.map(c => {
      const obj = c.toObject();
      if (obj.userId) {
        obj.user = obj.userId;
        delete obj.userId;
      } else {
        obj.user = null;
      }
      obj.status = obj.isApproved ? 'active' : 'hidden';
      return obj;
    });

    const total = await Comment.countDocuments(filter);
    res.json({ comments: formatted, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: xóa bình luận (hard delete)
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    await Comment.findByIdAndDelete(id);
    res.json({ message: 'Xóa bình luận thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: xuất CSV
exports.exportCommentsCSV = async (req, res) => {
  try {
    const comments = await Comment.find()
      .populate('productId', 'name slug')
      .populate('userId', 'email')
      .sort({ createdAt: -1 });

    const csvRows = [
      ['ID', 'Sản phẩm', 'Người dùng', 'Email', 'Nội dung', 'Đánh giá', 'Ngày tạo', 'Trạng thái'],
    ];

    comments.forEach(c => {
      csvRows.push([
        c._id,
        c.productId?.name || 'N/A',
        c.userName,
        c.userId?.email || 'Khách',
        c.content,
        c.rating,
        new Date(c.createdAt).toLocaleString(),
        c.isApproved ? 'Đã duyệt' : 'Chờ duyệt',
      ]);
    });

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="comments.csv"');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: lấy chi tiết một bình luận
exports.getCommentById = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id)
      .populate('userId', 'fullName email avatar')
      .populate('productId', 'name slug');
    if (!comment) return res.status(404).json({ message: 'Không tìm thấy bình luận' });

    const replies = await Comment.find({ replyTo: id, isApproved: true })
      .populate('userId', 'fullName email avatar')
      .sort({ createdAt: 1 });

    // Chuyển đổi cấu trúc: userId -> user
    const commentObj = comment.toObject();
    if (commentObj.userId) {
      commentObj.user = commentObj.userId;
      delete commentObj.userId;
    } else {
      commentObj.user = null;
    }

    commentObj.replies = replies.map(reply => {
      const obj = reply.toObject();
      if (obj.userId) {
        obj.user = obj.userId;
        delete obj.userId;
      } else {
        obj.user = null;
      }
      return obj;
    });

    res.json(commentObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: trả lời bình luận (admin reply)
exports.replyToComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user._id;
    const user = req.user;

    const parentComment = await Comment.findById(id);
    if (!parentComment) return res.status(404).json({ message: 'Không tìm thấy bình luận gốc' });

    const newReply = new Comment({
      productId: parentComment.productId,
      userId,
      userName: user.fullName,
      content,
      replyTo: id,
      isApproved: true,
    });
    await newReply.save();

    await Comment.findByIdAndUpdate(id, { $inc: { replyCount: 1 } });

    await newReply.populate('userId', 'fullName email avatar');

    // Transform
    const replyObj = newReply.toObject();
    if (replyObj.userId) {
      replyObj.user = replyObj.userId;
      delete replyObj.userId;
    } else {
      replyObj.user = null;
    }

    res.status(201).json(replyObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: ẩn/hiện bình luận (soft delete / active)
exports.toggleCommentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: 'Không tìm thấy bình luận' });

    comment.isApproved = !comment.isApproved;
    await comment.save();
    res.json({ status: comment.isApproved ? 'active' : 'hidden', message: 'Cập nhật trạng thái thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};