export type DienstbefreiungFormData = {
  dienstgrad: string;
  anlassDisziplin: string;
  andererAnlass: string;
  anlassVon: string;
  anlassBis: string;
  dienstbefreiung1: string;
  dienstbefreiung2: string;
  dienstbefreiung3: string;
  dienst: string[];
  andererDienst: string;
  antragstellerBemerkungen: string;
  dienstVorangehendeStufe1: string;
  dienstVorangehendeStufe1Bemerkung: string;
  dienstVorangehendeStufe2: string;
  dienstVorangehendeStufe2Bemerkung: string;
  begruendungSportler: string;
  statusTest: string;
  anhaenge: string;
};

export type AuthenticatedEmployee = {
  firstName: string;
  lastName: string;
  department: string;
  userId: string;
};

export const defaultDienstbefreiungFormData: DienstbefreiungFormData = {
  dienstgrad: "",
  anlassDisziplin: "",
  andererAnlass: "",
  anlassVon: "",
  anlassBis: "",
  dienstbefreiung1: "",
  dienstbefreiung2: "",
  dienstbefreiung3: "",
  dienst: [],
  andererDienst: "",
  antragstellerBemerkungen: "",
  dienstVorangehendeStufe1: "",
  dienstVorangehendeStufe1Bemerkung: "",
  dienstVorangehendeStufe2: "",
  dienstVorangehendeStufe2Bemerkung: "",
  begruendungSportler: "",
  statusTest: "",
  anhaenge: "",
};
