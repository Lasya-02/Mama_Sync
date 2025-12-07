import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css/PostDetail.css";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import apiClient from "../service/Api";

dayjs.extend(utc);

export default function PostDetail() {
  const { id } = useParams();         
  const location = useLocation();      
  const [post, setPost] = useState(location.state || null);
  const [replies, setReplies] = useState([]);
  const [replyContent, setReplyContent] = useState("");

  const uuss = sessionStorage.getItem("userdata") || "{}";
  const parsedData = JSON.parse(uuss);
  const userId = parsedData.email || "TestUser";
  const userName = parsedData.name || "TestUser";

  useEffect(() => {
    if (!post) {
      apiClient
        .get(`/forum/${id}`)
        .then((res) => setPost(res.data))
        .catch((err) => console.error("Error fetching post:", err));
    }
  }, [id, post]);

  useEffect(() => {
    apiClient
      .get(`/forum/${id}/replies`)
      .then((res) => setReplies(res.data))
      .catch((err) => console.error("Error fetching replies:", err));
  }, [id]);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    const newReply = { content: replyContent, userId };

    try {
      const res = await apiClient.post(
        `/forum/${id}/replies`,
        newReply
      );
      setReplies([...replies, res.data]);
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
