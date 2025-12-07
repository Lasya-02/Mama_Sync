import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/PostDetail.css";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import axios from "axios";   // ✅ added
dayjs.extend(utc);

export default function PostDetail() {
  const { id } = useParams();          // postId from URL
  const location = useLocation();      // post passed via navigate state
  const [post, setPost] = useState(location.state || null);
  const [replies, setReplies] = useState([]);
  const [replyContent, setReplyContent] = useState("");
  const apiURL = process.env.REACT_APP_API_URL;
  // Replace with logged-in userId from your auth context
  const uuss = sessionStorage.getItem("userdata") || "{}";
  const parsedData = JSON.parse(uuss);
  const userId = parsedData.email || "TestUser";
  const userName = parsedData.name || "TestUser";

  // ✅ Fetch post if not passed in state (axios version)
  useEffect(() => {
    if (!post) {
      axios
        .get(`${apiURL}/forum/${id}`)
        .then((res) => setPost(res.data))
        .catch((err) => console.error("Error fetching post:", err));
    }
  }, [id, post]);

  // ✅ Fetch replies (axios version)
  useEffect(() => {
    axios
      .get(`${apiURL}/forum/${id}/replies`)
      .then((res) => setReplies(res.data))
      .catch((err) => console.error("Error fetching replies:", err));
  }, [id]);

  // ✅ Submit a reply (axios version)
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    const newReply = { content: replyContent, userId };

    try {
      const res = await axios.post(
        `${apiURL}/forum/${id}/replies`,
        newReply
      );
      setReplies([...replies, res.data]);   // update UI
      setReplyContent("");
    } catch (err) {
      console.error("Error posting reply:", err);
    }
  };

  if (!post) return <p className="text-center mt-4">Loading post...</p>;

  return (
    <div className="container my-4">
      <div className="card shadow-sm">
        <div className="card-body">
          <h2 className="mb-3">{post.title}</h2>
          <p>{post.content}</p>
          <p><strong>Posted by:</strong> {userName}</p>
          <small className="text-muted">
            {dayjs(post.created_at).local().format("MMM D, YYYY h:mm A")}
          </small>

          <hr />

          <h4 className="mt-4">Replies</h4>
          {replies.length === 0 ? (
            <p className="text-muted">No replies yet. Be the first to comment!</p>
          ) : (
            <div className="list-group mb-3">
              {replies.map((reply) => (
                <div key={reply.id} className="list-group-item reply-card">
                  <p className="text-muted">
                    <strong>{userName}</strong>: {reply.content}
                  </p>
                  <small className="text-muted">
                    {dayjs(reply.created_at).local().format("MMM D, YYYY h:mm A")}
                  </small>
                </div>
              ))}
            </div>
          )}

          {/* Reply Form */}
          <form className="reply-form" onSubmit={handleReplySubmit}>
            <div className="mb-3">
              <textarea
                className="form-control"
                rows="3"
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-success">Reply</button>
          </form>
        </div>
      </div>
    </div>
  );
}
