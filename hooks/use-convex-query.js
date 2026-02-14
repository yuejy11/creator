import { useQuery, useMutation } from "convex/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

// 发请求、缓存数据、监听变化、自动更新UI
// 等价传统写法：
// useEffect(()=>{
//  fetch("/api/user")
// },[])
// 相较传统写法，convex 版本可以：
// 自动缓存、自动同步、实时更新（数据库变UI也变）
// 第一个参数 = query函数引用，后面的参数 = query需要的参数 ...args
export const useConvexQuery = (query, ...args) => {
  // 真正请求服务器、订阅数据库
  // 数据库变化 => 自动推送数据 => 组件重新渲染
  const result = useQuery(query, ...args);
  const [data, setData] = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (result === undefined) {
      setIsLoading(true);
    } else {
      try {
        setData(result);
        setError(null);
      } catch (err) {
        setError(err);
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    }
  }, [result]);

  return {
    data,
    isLoading,
    error,
  };
};

export const useConvexMutation = (mutation) => {
  const mutationFn = useMutation(mutation);
  const [data, setData] = useState(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (...args) => {
    setIsLoading(true);
    setError(null);

    try {
      // 真正请求服务器
      const response = await mutationFn(...args);
      setData(response);
      return response;
    } catch (err) {
      setError(err);
      toast.error(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, data, isLoading, error };
};
