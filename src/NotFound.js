import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="App">
    <h1>Unknown Error</h1>
    <Link to="/">Go to Main Page</Link>
  </div>
);

export default NotFound;
