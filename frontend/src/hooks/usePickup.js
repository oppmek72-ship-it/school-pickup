import { useState, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export function usePickup() {
  const [loading, setLoading] = useState(false);

  const createRequest = useCallback(async (studentId, eta, carPlate, carColor) => {
    setLoading(true);
    try {
      const { data } = await api.post('/pickup/request', { studentId, eta, carPlate, carColor });
      toast.success('ສົ່ງຄຳຮ້ອງສຳເລັດ');
      return data;
    } catch (error) {
      toast.error(error.response?.data?.error || 'ເກີດຂໍ້ຜິດພາດ');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const markArrived = useCallback(async (requestId) => {
    setLoading(true);
    try {
      const { data } = await api.put(`/pickup/${requestId}/arrive`);
      toast.success('ແຈ້ງມາຮອດແລ້ວ');
      return data;
    } catch (error) {
      toast.error(error.response?.data?.error || 'ເກີດຂໍ້ຜິດພາດ');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmPickup = useCallback(async (requestId) => {
    setLoading(true);
    try {
      const { data } = await api.put(`/pickup/${requestId}/confirm`);
      toast.success('ຢືນຢັນການຮັບສຳເລັດ');
      return data;
    } catch (error) {
      toast.error(error.response?.data?.error || 'ເກີດຂໍ້ຜິດພາດ');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelRequest = useCallback(async (requestId) => {
    setLoading(true);
    try {
      const { data } = await api.delete(`/pickup/${requestId}/cancel`);
      toast.success('ຍົກເລີກແລ້ວ');
      return data;
    } catch (error) {
      toast.error(error.response?.data?.error || 'ເກີດຂໍ້ຜິດພາດ');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createRequest, markArrived, confirmPickup, cancelRequest, loading };
}
