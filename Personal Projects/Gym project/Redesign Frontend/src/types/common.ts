export type CommonResponseDataType<T = unknown> = {
  status: "SUCCESS" | "FAIL";
  message: string;
  data: T;
};


