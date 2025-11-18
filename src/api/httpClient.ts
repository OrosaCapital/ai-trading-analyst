import { supabase } from '@/integrations/supabase/client';
import { EdgeFunctionResponse } from '@/types/api';

export async function callEdgeFunction<T>(
  functionName: string,
  body?: Record<string, any>
): Promise<EdgeFunctionResponse<T>> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: body || {},
    });

    if (error) {
      console.error(`Edge function ${functionName} error:`, error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error(`Edge function ${functionName} exception:`, err);
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error('Unknown error') 
    };
  }
}
