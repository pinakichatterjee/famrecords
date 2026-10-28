import { queryOptions } from "@tanstack/react-query";
import { listFamilyMembers, listMedicalRecords } from './health.functions';

export const RELATIONS = ["Self", "Spouse", "Son", "Daughter", "Father", "Mother", "Brother", "Sister", "Grandparent", "Other"];
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const membersQuery = queryOptions({
  queryKey: ["members"],
  queryFn: () => listFamilyMembers(),
});

export const recordsQuery = queryOptions({
  queryKey: ["records"],
  queryFn: () => listMedicalRecords(),
});
