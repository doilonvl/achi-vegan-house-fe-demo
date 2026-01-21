export type ReservationRequestPayload = {
  fullName: string;
  phoneNumber: string;
  email?: string;
  guestCount: number;
  reservationDate: string; // YYYY-MM-DD
  reservationTime: string; // HH:mm
  note?: string;
  source?: string;
  locale?: string;
};

export type ReservationRequestResponse = {
  id?: string;
  status?: string;
  message?: string;
  createdAt?: string;
};
