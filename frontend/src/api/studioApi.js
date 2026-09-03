import api from './axios';

export const getStudios = () => api.get('/studios');
export const getStudio = (id) => api.get(`/studios/${id}`);
export const createStudio = (data) => api.post('/studios', data);
export const updateStudio = (id, data) => api.put(`/studios/${id}`, data);
export const deleteStudio = (id) => api.delete(`/studios/${id}`);
