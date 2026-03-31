import { useState, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export function usePickup() {
  const [loading, setLoading] = useState(false);

  // callType: "five_minutes" | "ten_minutes" | "arrived"
  const createRequest = useCallback(async (studentId, callType, carPlate, carColor) => {
    setLoading(true);
    try {
      const { data } = await api.post('/pickup/call', { studentId, callType, carPlate, carColor });
      const labels = { five_minutes: '5 ນາທີ', ten_minutes: '10 ນາທີ', arrived: 'ຮອດແລ້ວ' };
      toast.success(`ເອີ້ນແລ້ວ — ${labels[callType] || callType}`);
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
      toast.success('ສົ່ງນ້ອງແລ້ວ ✅');
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
      const { data } = await api.put(`/pickup/${requestId}/cancel`);
      toast.success('ຍົກເລີກແລ້ວ');
      return data;
    } catch (error) {
      toast.error(error.response?.data?.error || 'ເກີດຂໍ້ຜິດພາດ');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createRequest, confirmPickup, cancelRequest, loading };
}
