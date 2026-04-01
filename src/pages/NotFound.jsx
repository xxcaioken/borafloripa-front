import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="not-found">
      <div className="not-found-code">404</div>
      <h2>Rolê não encontrado</h2>
      <p>Esse evento pode ter acabado ou o link está errado.</p>
      <button className="btn-primary" onClick={() => navigate('/')}>
        Ver programação
      </button>
    </div>
  );
}
