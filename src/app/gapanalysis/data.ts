export type Status = 'yes' | 'no' | 'partial' | 'na' | null;

export interface Requirement {
  id: string;
  text: string;
  cap: string;
}

export interface Section {
  id: string;
  label: string;
  requirements: Requirement[];
}

export interface Subpart {
  letter: string;
  title: string;
  sections: Section[];
}

const MOL_CONTROLS = 'CONTROLS — MOL CHECKLIST · MOL.34229 Controls - Qualitative Assays · MOL.34270 Controls - Quantitative Assays · MOL.34311 Tolerance Limits · MOL.34325 Alternative Control Procedures · MOL.34352 QC Confirmation of Acceptability · MOL.34393 QC Corrective Action · MOL.34434 QC Handling · MOL.34475 QC Statistics · MOL.34516 Qualitative Cut-Off Verification · MOL.34557 Control Storage · MOL.35350 Carryover · MOL.35360 Internal Controls - NAA · MOL.48588 Pipette Accuracy · MOL.49520 Thermocycler Temperature Checks · COM.30600 Maintenance/Function Checks · COM.30625 Function Check Tolerance Limits · COM.30650 Instrument and Equipment Records · COM.30750-30800 · GEN.59980-61600';
const MOL_VALIDATION = '(a, b2, c) CONTROLS — MOL CHECKLIST · MOL.34229-34557 · COM.40000-40850 Test Method Validation and Verification · (f) MOL.30555 Analytic Interpretation Guidelines · (g) MOL.30785-31590 Assay Validation · (1) DRA.11300 Director Responsibility - Personnel, DRA.11425 Director Responsibility - Delegation of Functions';
const GEN_20208 = 'GEN.20208 QM Patient Care Services · GEN.20325 Employee and Patient Quality Communication · GEN.20351 Adverse Patient Reporting Event · Gen.41307 Report errors · Gen.41310 Corrected reports';
const GEN_42195 = 'GEN.42195 Remote LIS · GEN.43033 Custom LIS · GEN.43040 LIS Policy and Procedure Approval · AUTOVERIFICATION GEN.43875-43893';

export const SUBPARTS: Subpart[] = [
  {
    letter: 'A',
    title: 'General Provisions',
    sections: [
      {
        id: 'A-820.5',
        label: '§ 820.5 — Quality System',
        requirements: [
          { id: 'A-820.5-1', text: 'Each manufacturer shall establish and maintain a quality system that is appropriate for the specific medical device(s) designed or manufactured, and that meets the requirements of this part.', cap: 'GEN.16902, QM Program Implementation · GEN.13806, QM Program' },
        ],
      },
    ],
  },
  {
    letter: 'B',
    title: 'Quality System Requirements',
    sections: [
      {
        id: 'B-820.20',
        label: '§ 820.20 — Management Responsibility',
        requirements: [
          { id: 'B-820.20-a', text: '(a) Quality policy. Management with executive responsibility shall establish its policy and objectives for, and commitment to, quality. Management with executive responsibility shall ensure that the quality policy is understood, implemented, and maintained at all levels of the organization.', cap: '(a) COM.04000 Written QM Program, GEN.13806 QM Program · DRA.10440 Effective QM' },
          { id: 'B-820.20-b', text: '(b) Organization. Each manufacturer shall establish and maintain an adequate organizational structure to ensure that devices are designed and produced in accordance with the requirements of this part.', cap: '(b) GEN.54025 Laboratory Personnel Evaluation Roster, GEN.54000 Organizational Chart' },
          { id: 'B-820.20-b1', text: '(b)(1) Responsibility and authority. Each manufacturer shall establish the appropriate responsibility, authority, and interrelation of all personnel who manage, perform, and assess work affecting quality, and provide the independence and authority necessary to perform these tasks.', cap: '(1) DRA checklist, all' },
          { id: 'B-820.20-b2', text: '(b)(2) Resources. Each manufacturer shall provide adequate resources, including the assignment of trained personnel, for management, performance of work, and assessment activities, including internal quality audits, to meet the requirements of this part.', cap: '(2) GEN.55450 Personnel Training, GEN.55500 Competency Assessment - Nonwaived Testing, GEN.55510, GEN.55525, DRA.10445 Interim Self-Inspection, DRA.11300 Director Responsibility - Personnel' },
          { id: 'B-820.20-b3', text: '(b)(3) Management representative. Management with executive responsibility shall appoint, and document such appointment of, a member of management who shall have established authority over and responsibility for quality system requirements.', cap: '(3) DRA.11300 Director Responsibility - Personnel, DRA.11425 Director Responsibility - Delegation of Functions' },
          { id: 'B-820.20-b3i', text: '(b)(3)(i) Ensuring that quality system requirements are effectively established and effectively maintained in accordance with this part.', cap: '(i-ii) DRA.10460 Director Responsibility - PT/QC' },
          { id: 'B-820.20-b3ii', text: '(b)(3)(ii) Reporting on the performance of the quality system to management with executive responsibility for review.', cap: '(i-ii) DRA.10460 Director Responsibility - PT/QC' },
          { id: 'B-820.20-c', text: '(c) Management review. Management with executive responsibility shall review the suitability and effectiveness of the quality system at defined intervals and with sufficient frequency according to established procedures. The dates and results of quality system reviews shall be documented.', cap: '(c) DRA.10445 Director Responsibility - Interim Self-Assessment, DRA.10460 Director Responsibility - PT/QC' },
          { id: 'B-820.20-d', text: '(d) Quality planning. Each manufacturer shall establish a quality plan which defines the quality practices, resources, and activities relevant to devices that are designed and manufactured.', cap: '(d) GEN.13806 QM Program, GEN.20100 QM Extent of Coverage, GEN.20208 QM Patient Care Services, GEN.20316 QM Indicators of Quality, GEN.20325 Employee and Patient Quality Communication' },
          { id: 'B-820.20-e', text: '(e) Quality system procedures. Each manufacturer shall establish quality system procedures and instructions. An outline of the structure of the documentation used in the quality system shall be established where appropriate.', cap: '(e) GEN.20375 Document Control, COM.10000-10500 Procedure Manual' },
        ],
      },
      {
        id: 'B-820.22',
        label: '§ 820.22 — Quality Audit',
        requirements: [
          { id: 'B-820.22-1', text: 'Each manufacturer shall establish procedures for quality audits and conduct such audits to assure that the quality system is in compliance with the established quality system requirements and to determine the effectiveness of the quality system. Quality audits shall be conducted by individuals who do not have direct responsibility for the matters being audited. Corrective action(s), including a reaudit of deficient matters, shall be taken when necessary. A report of the results of each quality audit, and reaudit(s) where taken, shall be made and such reports shall be reviewed by management. The dates and results of quality audits and reaudits shall be documented.', cap: 'COM.01000-01900 Proficiency Testing, DRA.10440 Effective QM, DRA.10445 Director Responsibility - Interim Self-Inspection, DRA.10460 Director Responsibility - PT/QC' },
        ],
      },
      {
        id: 'B-820.25',
        label: '§ 820.25 — Personnel',
        requirements: [
          { id: 'B-820.25-a', text: '(a) General. Each manufacturer shall have sufficient personnel with the necessary education, background, training, and experience to assure that all activities required by this part are correctly performed.', cap: 'GEN.53400 Section Director Qualifications/Responsibilities, GEN.53600 General Supervisor, GEN.53625 Technical Consultant, GEN.53650 Clinical Consultant, GEN.54000-GEN.57000 ALL PERSONNEL' },
          { id: 'B-820.25-b', text: '(b) Training. Each manufacturer shall establish procedures for identifying training needs and ensure that all personnel are trained to adequately perform their assigned responsibilities. Training shall be documented.', cap: 'GEN.53400-GEN.57000 ALL PERSONNEL' },
          { id: 'B-820.25-b1', text: '(b)(1) As part of their training, personnel shall be made aware of device defects which may occur from the improper performance of their specific jobs.', cap: '' },
          { id: 'B-820.25-b2', text: '(b)(2) Personnel who perform verification and validation activities shall be made aware of defects and errors that may be encountered as part of their job functions.', cap: '' },
        ],
      },
    ],
  },
  {
    letter: 'C',
    title: 'Design Controls',
    sections: [
      {
        id: 'C-820.30',
        label: '§ 820.30 — Design Controls',
        requirements: [
          { id: 'C-820.30-a', text: '(a) General. Each manufacturer of any class III or class II device, and the class I devices listed in paragraph (a)(2) of this section, shall establish and maintain procedures to control the design of the device in order to ensure that specified design requirements are met.', cap: 'COM.10000-10500 Procedure Manual · DRA.11200 Director Responsibility - Education/R&D' },
          { id: 'C-820.30-b', text: '(b) Design and development planning. Each manufacturer shall establish and maintain plans that describe or reference the design and development activities and define responsibility for implementation. The plans shall identify and describe the interfaces with different groups or activities that provide, or result in, input to the design and development process. The plans shall be reviewed, updated, and approved as design and development evolves.', cap: 'DRA.11200 Director Responsibility - Education/R&D' },
          { id: 'C-820.30-c', text: '(c) Design input. Each manufacturer shall establish and maintain procedures to ensure that the design requirements relating to a device are appropriate and address the intended use of the device, including the needs of the user and patient. The procedures shall include a mechanism for addressing incomplete, ambiguous, or conflicting requirements. The design input requirements shall be documented and shall be reviewed and approved by a designated individual(s). The approval, including the date and signature of the individual(s) approving the requirements, shall be documented.', cap: '(c,d) GEN.41067-41345 Results Reporting and Referral of Testing' },
          { id: 'C-820.30-d', text: '(d) Design output. Each manufacturer shall establish and maintain procedures for defining and documenting design output in terms that allow an adequate evaluation of conformance to design input requirements. Design output procedures shall contain or make reference to acceptance criteria and shall ensure that those design outputs that are essential for the proper functioning of the device are identified. Design output shall be documented, reviewed, and approved before release.', cap: '(c,d) GEN.41067-41345 Results Reporting and Referral of Testing' },
          { id: 'C-820.30-e', text: '(e) Design review. Each manufacturer shall establish and maintain procedures to ensure that formal documented reviews of the design results are planned and conducted at appropriate stages of the device\'s design development. The procedures shall ensure that participants at each design review include representatives of all functions concerned with the design stage being reviewed and an individual(s) who does not have direct responsibility for the design stage being reviewed. The results of a design review, including identification of the design, the date, and the individual(s) performing the review, shall be documented in the DHF.', cap: '(e) COM.40000-40850 Test Method Validation and Verification - Nonwaived Tests' },
          { id: 'C-820.30-f', text: '(f) Design verification. Each manufacturer shall establish and maintain procedures for verifying the device design. Design verification shall confirm that the design output meets the design input requirements. The results of the design verification, including identification of the design, method(s), the date, and the individual(s) performing the verification, shall be documented in the DHF.', cap: '(f) MOL.30555 Analytic Interpretation Guidelines' },
          { id: 'C-820.30-g', text: '(g) Design validation. Each manufacturer shall establish and maintain procedures for validating the device design. Design validation shall be performed under defined operating conditions on initial production units, lots, or batches, or their equivalents. Design validation shall ensure that devices conform to defined user needs and intended uses and shall include testing of production units under actual or simulated use conditions. Design validation shall include software validation and risk analysis, where appropriate. The results shall be documented in the DHF.', cap: '(g) MOL.30785-31590 Assay Validation' },
          { id: 'C-820.30-h', text: '(h) Design transfer. Each manufacturer shall establish and maintain procedures to ensure that the device design is correctly translated into production specifications.', cap: '' },
          { id: 'C-820.30-i', text: '(i) Design changes. Each manufacturer shall establish and maintain procedures for the identification, documentation, validation or where appropriate verification, review, and approval of design changes before their implementation.', cap: '' },
          { id: 'C-820.30-j', text: '(j) Design history file. Each manufacturer shall establish and maintain a DHF for each type of device. The DHF shall contain or reference the records necessary to demonstrate that the design was developed in accordance with the approved design plan and the requirements of this part.', cap: '' },
        ],
      },
    ],
  },
  {
    letter: 'D',
    title: 'Document Controls',
    sections: [
      {
        id: 'D-820.40',
        label: '§ 820.40 — Document Controls',
        requirements: [
          { id: 'D-820.40-1', text: 'Each manufacturer shall establish and maintain procedures to control all documents that are required by this part.', cap: 'GEN.20375 Document Control' },
          { id: 'D-820.40-a', text: '(a) Document approval and distribution. Each manufacturer shall designate an individual(s) to review for adequacy and approve prior to issuance all documents established to meet the requirements of this part. The approval, including the date and signature of the individual(s) approving the document, shall be documented. Documents shall be available at all locations for which they are designated, used, or otherwise necessary, and all obsolete documents shall be promptly removed from all points of use.', cap: 'GEN.20375 Document Control' },
          { id: 'D-820.40-b', text: '(b) Document changes. Changes to documents shall be reviewed and approved by an individual(s) in the same function or organization that performed the original review and approval. Approved changes shall be communicated to the appropriate personnel in a timely manner. Each manufacturer shall maintain records of changes to documents. Change records shall include a description of the change, identification of the affected documents, the signature of the approving individual(s), the approval date, and when the change becomes effective.', cap: 'GEN.20375 Document Control' },
        ],
      },
    ],
  },
  {
    letter: 'E',
    title: 'Purchasing Controls',
    sections: [
      {
        id: 'E-820.50',
        label: '§ 820.50 — Purchasing Controls',
        requirements: [
          { id: 'E-820.50-1', text: 'Each manufacturer shall establish and maintain procedures to ensure that all purchased or otherwise received product and services conform to specified requirements.', cap: '' },
          { id: 'E-820.50-a', text: '(a) Evaluation of suppliers, contractors, and consultants. Each manufacturer shall establish and maintain the requirements, including quality requirements, that must be met by suppliers, contractors, and consultants.', cap: '' },
          { id: 'E-820.50-a1', text: '(a)(1) Evaluate and select potential suppliers, contractors, and consultants on the basis of their ability to meet specified requirements, including quality requirements. The evaluation shall be documented.', cap: '' },
          { id: 'E-820.50-a2', text: '(a)(2) Define the type and extent of control to be exercised over the product, services, suppliers, contractors, and consultants, based on the evaluation results.', cap: '' },
          { id: 'E-820.50-a3', text: '(a)(3) Establish and maintain records of acceptable suppliers, contractors, and consultants.', cap: '' },
          { id: 'E-820.50-b', text: '(b) Purchasing data. Each manufacturer shall establish and maintain data that clearly describe or reference the specified requirements, including quality requirements, for purchased or otherwise received product and services. Purchasing documents shall include, where possible, an agreement that the suppliers, contractors, and consultants agree to notify the manufacturer of changes in the product or service. Purchasing data shall be approved in accordance with §820.40.', cap: 'Not specifically addressed' },
        ],
      },
    ],
  },
  {
    letter: 'F',
    title: 'Identification and Traceability',
    sections: [
      {
        id: 'F-820.60',
        label: '§ 820.60 — Identification',
        requirements: [
          { id: 'F-820.60-1', text: 'Each manufacturer shall establish and maintain procedures for identifying product during all stages of receipt, production, distribution, and installation to prevent mixups.', cap: 'DOES NOT APPLY' },
          { id: 'F-820.65-1', text: '(§ 820.65) Each manufacturer of a device intended for surgical implant into the body or to support or sustain life whose failure to perform when properly used can be reasonably expected to result in a significant injury to the user shall establish and maintain procedures for identifying with a control number each unit, lot, or batch of finished devices and where appropriate components. The procedures shall facilitate corrective action. Such identification shall be documented in the DHR.', cap: '' },
        ],
      },
    ],
  },
  {
    letter: 'G',
    title: 'Production and Process Controls',
    sections: [
      {
        id: 'G-820.70',
        label: '§ 820.70 — Production and Process Controls',
        requirements: [
          { id: 'G-820.70-a', text: '(a) General. Each manufacturer shall develop, conduct, control, and monitor production processes to ensure that a device conforms to its specifications. Where deviations from device specifications could occur as a result of the manufacturing process, the manufacturer shall establish and maintain process control procedures that describe any process controls necessary to ensure conformance to specifications.', cap: MOL_CONTROLS },
          { id: 'G-820.70-a1', text: '(a)(1) Documented instructions, standard operating procedures (SOP\'s), and methods that define and control the manner of production.', cap: MOL_CONTROLS },
          { id: 'G-820.70-a2', text: '(a)(2) Monitoring and control of process parameters and component and device characteristics during production.', cap: MOL_CONTROLS },
          { id: 'G-820.70-a3', text: '(a)(3) Compliance with specified reference standards or codes.', cap: MOL_CONTROLS },
          { id: 'G-820.70-a4', text: '(a)(4) The approval of processes and process equipment.', cap: MOL_CONTROLS },
          { id: 'G-820.70-a5', text: '(a)(5) Criteria for workmanship which shall be expressed in documented standards or by means of identified and approved representative samples.', cap: '' },
          { id: 'G-820.70-b', text: '(b) Production and process changes. Each manufacturer shall establish and maintain procedures for changes to a specification, method, process, or procedure. Such changes shall be verified or where appropriate validated according to §820.75, before implementation and these activities shall be documented. Changes shall be approved in accordance with §820.40.', cap: '' },
          { id: 'G-820.70-c', text: '(c) Environmental control. Where environmental conditions could reasonably be expected to have an adverse effect on product quality, the manufacturer shall establish and maintain procedures to adequately control these environmental conditions. Environmental control system(s) shall be periodically inspected to verify that the system, including necessary equipment, is adequate and functioning properly. These activities shall be documented and reviewed.', cap: '' },
          { id: 'G-820.70-d', text: '(d) Personnel. Each manufacturer shall establish and maintain requirements for the health, cleanliness, personal practices, and clothing of personnel if contact between such personnel and product or environment could reasonably be expected to have an adverse effect on product quality.', cap: '' },
          { id: 'G-820.70-e', text: '(e) Contamination control. Each manufacturer shall establish and maintain procedures to prevent contamination of equipment or product by substances that could reasonably be expected to have an adverse effect on product quality.', cap: '' },
          { id: 'G-820.70-f', text: '(f) Buildings. Buildings shall be of suitable design and contain sufficient space to perform necessary operations, prevent mixups, and assure orderly handling.', cap: '' },
          { id: 'G-820.70-g', text: '(g) Equipment. Each manufacturer shall ensure that all equipment used in the manufacturing process meets specified requirements and is appropriately designed, constructed, placed, and installed to facilitate maintenance, adjustment, cleaning, and use.', cap: '' },
          { id: 'G-820.70-g1', text: '(g)(1) Maintenance schedule. Each manufacturer shall establish and maintain schedules for the adjustment, cleaning, and other maintenance of equipment to ensure that manufacturing specifications are met. Maintenance activities, including the date and individual(s) performing the maintenance activities, shall be documented.', cap: '' },
          { id: 'G-820.70-g2', text: '(g)(2) Inspection. Each manufacturer shall conduct periodic inspections in accordance with established procedures to ensure adherence to applicable equipment maintenance schedules. The inspections, including the date and individual(s) conducting the inspections, shall be documented.', cap: '' },
          { id: 'G-820.70-g3', text: '(g)(3) Adjustment. Each manufacturer shall ensure that any inherent limitations or allowable tolerances are visibly posted on or near equipment requiring periodic adjustments or are readily available to personnel performing these adjustments.', cap: '' },
          { id: 'G-820.70-h', text: '(h) Manufacturing material. Where a manufacturing material could reasonably be expected to have an adverse effect on product quality, the manufacturer shall establish and maintain procedures for the use and removal of such manufacturing material to ensure that it is removed or limited to an amount that does not adversely affect the device\'s quality. The removal or reduction of such manufacturing material shall be documented.', cap: '' },
          { id: 'G-820.70-i', text: '(i) Automated processes. When computers or automated data processing systems are used as part of production or the quality system, the manufacturer shall validate computer software for its intended use according to an established protocol. All software changes shall be validated before approval and issuance. These validation activities and results shall be documented.', cap: '' },
        ],
      },
      {
        id: 'G-820.72',
        label: '§ 820.72 — Inspection, Measuring, and Test Equipment',
        requirements: [
          { id: 'G-820.72-1', text: '(a) Control of inspection, measuring, and test equipment. Each manufacturer shall ensure that all inspection, measuring, and test equipment is suitable for its intended purposes and is capable of producing valid results. Each manufacturer shall establish and maintain procedures to ensure that equipment is routinely calibrated, inspected, checked, and maintained. (b) Calibration. Calibration procedures shall include specific directions and limits for accuracy and precision. When accuracy and precision limits are not met, there shall be provisions for remedial action to reestablish the limits and to evaluate whether there was any adverse effect on the device\'s quality. (b)(1) Calibration standards shall be traceable to national or international standards. (b)(2) Calibration records shall include equipment identification, calibration dates, the individual performing each calibration, and the next calibration date.', cap: 'MOL.48588 Pipette Accuracy · MOL.49520 Thermocycler Temperature Checks · QUANTITATIVE ASSAYS: CALIBRATION AND STANDARDS · Limited applicability, as we do not perform quantitative testing · MOL.33655-34024' },
        ],
      },
      {
        id: 'G-820.75',
        label: '§ 820.75 — Process Validation',
        requirements: [
          { id: 'G-820.75-a', text: '(a) Where the results of a process cannot be fully verified by subsequent inspection and test, the process shall be validated with a high degree of assurance and approved according to established procedures. The validation activities and results, including the date and signature of the individual(s) approving the validation and where appropriate the major equipment validated, shall be documented.', cap: MOL_VALIDATION },
          { id: 'G-820.75-b', text: '(b) Each manufacturer shall establish and maintain procedures for monitoring and control of process parameters for validated processes to ensure that the specified requirements continue to be met.', cap: MOL_VALIDATION },
          { id: 'G-820.75-b1', text: '(b)(1) Each manufacturer shall ensure that validated processes are performed by qualified individual(s).', cap: MOL_VALIDATION },
          { id: 'G-820.75-b2', text: '(b)(2) For validated processes, the monitoring and control methods and data, the date performed, and, where appropriate, the individual(s) performing the process or the major equipment used shall be documented.', cap: MOL_VALIDATION },
          { id: 'G-820.75-c', text: '(c) When changes or process deviations occur, the manufacturer shall review and evaluate the process and perform revalidation where appropriate. These activities shall be documented.', cap: MOL_VALIDATION },
        ],
      },
    ],
  },
  {
    letter: 'H',
    title: 'Acceptance Activities',
    sections: [
      {
        id: 'H-820.80',
        label: '§ 820.80 — Receiving, In-Process, and Finished Device Acceptance',
        requirements: [
          { id: 'H-820.80-a', text: '(a) General. Each manufacturer shall establish and maintain procedures for acceptance activities. Acceptance activities include inspections, tests, or other verification activities.', cap: '' },
          { id: 'H-820.80-b', text: '(b) Receiving acceptance activities. Each manufacturer shall establish and maintain procedures for acceptance of incoming product. Incoming product shall be inspected, tested, or otherwise verified as conforming to specified requirements. Acceptance or rejection shall be documented.', cap: '' },
          { id: 'H-820.80-c', text: '(c) In-process acceptance activities. Each manufacturer shall establish and maintain acceptance procedures, where appropriate, to ensure that specified requirements for in-process product are met. Such procedures shall ensure that in-process product is controlled until the required inspection and tests or other verification activities have been completed, or necessary approvals are received, and are documented.', cap: '' },
          { id: 'H-820.80-d', text: '(d) Final acceptance activities. Each manufacturer shall establish and maintain procedures for finished device acceptance to ensure that each production run, lot, or batch of finished devices meets acceptance criteria. Finished devices shall be held in quarantine or otherwise adequately controlled until released.', cap: '' },
          { id: 'H-820.80-d1', text: '(d)(1) The activities required in the DMR are completed.', cap: '' },
          { id: 'H-820.80-d2', text: '(d)(2) The associated data and documentation is reviewed.', cap: '' },
          { id: 'H-820.80-d3', text: '(d)(3) The release is authorized by the signature of a designated individual(s).', cap: '' },
          { id: 'H-820.80-d4', text: '(d)(4) The authorization is dated.', cap: '' },
          { id: 'H-820.80-e', text: '(e) Acceptance records. Each manufacturer shall document acceptance activities required by this part. These records shall include: the acceptance activities performed; the dates acceptance activities are performed; the results; the signature of the individual(s) conducting the acceptance activities; and where appropriate the equipment used. These records shall be part of the DHR.', cap: '' },
        ],
      },
      {
        id: 'H-820.86',
        label: '§ 820.86 — Acceptance Status',
        requirements: [
          { id: 'H-820.86-1', text: 'Each manufacturer shall identify by suitable means the acceptance status of product, to indicate the conformance or nonconformance of product with acceptance criteria. The identification of acceptance status shall be maintained throughout manufacturing, packaging, labeling, installation, and servicing of the product to ensure that only product which has passed the required acceptance activities is distributed, used, or installed.', cap: '' },
        ],
      },
    ],
  },
  {
    letter: 'I',
    title: 'Nonconforming Product',
    sections: [
      {
        id: 'I-820.90',
        label: '§ 820.90 — Nonconforming Product',
        requirements: [
          { id: 'I-820.90-a', text: '(a) Control of nonconforming product. Each manufacturer shall establish and maintain procedures to control product that does not conform to specified requirements. The procedures shall address the identification, documentation, evaluation, segregation, and disposition of nonconforming product. The evaluation of nonconformance shall include a determination of the need for an investigation and notification of the persons or organizations responsible for the nonconformance. The evaluation and any investigation shall be documented.', cap: '' },
          { id: 'I-820.90-b', text: '(b) Nonconformity review and disposition.', cap: '' },
          { id: 'I-820.90-b1', text: '(b)(1) Each manufacturer shall establish and maintain procedures that define the responsibility for review and the authority for the disposition of nonconforming product. The procedures shall set forth the review and disposition process. Disposition of nonconforming product shall be documented. Documentation shall include the justification for use of nonconforming product and the signature of the individual(s) authorizing the use.', cap: '' },
          { id: 'I-820.90-b2', text: '(b)(2) Each manufacturer shall establish and maintain procedures for rework, to include retesting and reevaluation of the nonconforming product after rework, to ensure that the product meets its current approved specifications. Rework and reevaluation activities, including a determination of any adverse effect from the rework upon the product, shall be documented in the DHR.', cap: '' },
        ],
      },
    ],
  },
  {
    letter: 'J',
    title: 'Corrective and Preventive Action',
    sections: [
      {
        id: 'J-820.100',
        label: '§ 820.100 — Corrective and Preventive Action',
        requirements: [
          { id: 'J-820.100-a', text: '(a) Each manufacturer shall establish and maintain procedures for implementing corrective and preventive action.', cap: 'GEN.20316 QM Indicators of Quality' },
          { id: 'J-820.100-a1', text: '(a)(1) Analyzing processes, work operations, concessions, quality audit reports, quality records, service records, complaints, returned product, and other sources of quality data to identify existing and potential causes of nonconforming product, or other quality problems. Appropriate statistical methodology shall be employed where necessary to detect recurring quality problems.', cap: 'GEN.20316 QM Indicators of Quality' },
          { id: 'J-820.100-a2', text: '(a)(2) Investigating the cause of nonconformities relating to product, processes, and the quality system.', cap: 'GEN.20316 QM Indicators of Quality' },
          { id: 'J-820.100-a3', text: '(a)(3) Identifying the action(s) needed to correct and prevent recurrence of nonconforming product and other quality problems.', cap: 'GEN.20316 QM Indicators of Quality' },
          { id: 'J-820.100-a4', text: '(a)(4) Verifying or validating the corrective and preventive action to ensure that such action is effective and does not adversely affect the finished device.', cap: 'GEN.20316 QM Indicators of Quality' },
          { id: 'J-820.100-a5', text: '(a)(5) Implementing and recording changes in methods and procedures needed to correct and prevent identified quality problems.', cap: 'GEN.20316 QM Indicators of Quality' },
          { id: 'J-820.100-a6', text: '(a)(6) Ensuring that information related to quality problems or nonconforming product is disseminated to those directly responsible for assuring the quality of such product or the prevention of such problems.', cap: 'GEN.20316 QM Indicators of Quality' },
          { id: 'J-820.100-a7', text: '(a)(7) Submitting relevant information on identified quality problems, as well as corrective and preventive actions, for management review.', cap: 'GEN.20316 QM Indicators of Quality' },
          { id: 'J-820.100-b', text: '(b) All activities required under this section, and their results, shall be documented.', cap: 'GEN.20316 QM Indicators of Quality' },
        ],
      },
    ],
  },
  {
    letter: 'K',
    title: 'Labeling and Packaging Control',
    sections: [
      {
        id: 'K-820.120',
        label: '§ 820.120 — Device Labeling',
        requirements: [
          { id: 'K-820.120-1', text: 'Each manufacturer shall establish and maintain procedures to control labeling activities.', cap: 'GEN.40100 Specimen Collection Manual Elements - Labeling samples · COM.30400 Reagent Expiration Date - Labeling Reagents' },
          { id: 'K-820.120-a', text: '(a) Label integrity. Labels shall be printed and applied so as to remain legible and affixed during the customary conditions of processing, storage, handling, distribution, and where appropriate use.', cap: '' },
          { id: 'K-820.120-b', text: '(b) Labeling inspection. Labeling shall not be released for storage or use until a designated individual(s) has examined the labeling for accuracy including, where applicable, the correct unique device identifier (UDI) or universal product code (UPC), expiration date, control number, storage instructions, handling instructions, and any additional processing instructions. The release, including the date and signature of the individual(s) performing the examination, shall be documented in the DHR.', cap: '' },
          { id: 'K-820.120-c', text: '(c) Labeling storage. Each manufacturer shall store labeling in a manner that provides proper identification and is designed to prevent mixups.', cap: '' },
          { id: 'K-820.120-d', text: '(d) Labeling operations. Each manufacturer shall control labeling and packaging operations to prevent labeling mixups. The label and labeling used for each production unit, lot, or batch shall be documented in the DHR.', cap: '' },
          { id: 'K-820.120-e', text: '(e) Control number. Where a control number is required by §820.65, that control number shall be on or shall accompany the device through distribution.', cap: '' },
        ],
      },
      {
        id: 'K-820.130',
        label: '§ 820.130 — Device Packaging',
        requirements: [
          { id: 'K-820.130-1', text: 'Each manufacturer shall ensure that device packaging and shipping containers are designed and constructed to protect the device from alteration or damage during the customary conditions of processing, storage, handling, and distribution.', cap: 'DOES NOT APPLY BEYOND SPECIMEN COLLECTION INSTRUCTION · GEN.40016-40100 Specimen Collection Instructions · GEN.40490-41042 Specimen Collection and Labeling' },
        ],
      },
    ],
  },
  {
    letter: 'L',
    title: 'Handling, Storage, Distribution, and Installation',
    sections: [
      {
        id: 'L-820.140',
        label: '§ 820.140 — Handling',
        requirements: [
          { id: 'L-820.140-1', text: 'Each manufacturer shall establish and maintain procedures to ensure that mixups, damage, deterioration, contamination, or other adverse effects to product do not occur during handling.', cap: '' },
        ],
      },
      {
        id: 'L-820.150',
        label: '§ 820.150 — Storage',
        requirements: [
          { id: 'L-820.150-a', text: '(a) Each manufacturer shall establish and maintain procedures for the control of storage areas and stock rooms for product to prevent mixups, damage, deterioration, contamination, or other adverse effects pending use or distribution and to ensure that no obsolete, rejected, or deteriorated product is used or distributed. When the quality of product deteriorates over time, it shall be stored in a manner to facilitate proper stock rotation, and its condition shall be assessed as appropriate.', cap: '' },
          { id: 'L-820.150-b', text: '(b) Each manufacturer shall establish and maintain procedures that describe the methods for authorizing receipt from and dispatch to storage areas and stock rooms.', cap: '' },
        ],
      },
      {
        id: 'L-820.160',
        label: '§ 820.160 — Distribution',
        requirements: [
          { id: 'L-820.160-a', text: '(a) Each manufacturer shall establish and maintain procedures for control and distribution of finished devices to ensure that only those devices approved for release are distributed and that purchase orders are reviewed to ensure that ambiguities and errors are resolved before devices are released for distribution. Where a device\'s fitness for use or quality deteriorates over time, the procedures shall ensure that expired devices or devices deteriorated beyond acceptable fitness for use are not distributed.', cap: '' },
          { id: 'L-820.160-b', text: '(b) Each manufacturer shall maintain distribution records which include or refer to the location of: the name and address of the initial consignee; the identification and quantity of devices shipped; the date shipped; and any control number(s) used.', cap: '' },
        ],
      },
      {
        id: 'L-820.170',
        label: '§ 820.170 — Installation',
        requirements: [
          { id: 'L-820.170-a', text: '(a) Each manufacturer of a device requiring installation shall establish and maintain adequate installation and inspection instructions, and where appropriate test procedures. Instructions and procedures shall include directions for ensuring proper installation so that the device will perform as intended after installation. The manufacturer shall distribute the instructions and procedures with the device or otherwise make them available to the person(s) installing the device.', cap: 'Does not apply' },
          { id: 'L-820.170-b', text: '(b) The person installing the device shall ensure that the installation, inspection, and any required testing are performed in accordance with the manufacturer\'s instructions and procedures and shall document the inspection and any test results to demonstrate proper installation.', cap: 'Does not apply' },
        ],
      },
    ],
  },
  {
    letter: 'M',
    title: 'Records',
    sections: [
      {
        id: 'M-820.180',
        label: '§ 820.180 — General Requirements',
        requirements: [
          { id: 'M-820.180-1', text: 'All records required by this part shall be maintained at the manufacturing establishment or other location that is reasonably accessible to responsible officials of the manufacturer and to employees of FDA designated to perform inspections. Such records shall be legible and shall be stored to minimize deterioration and to prevent loss. Those records stored in automated data processing systems shall be backed up.', cap: '' },
          { id: 'M-820.180-a', text: '(a) Confidentiality. Records deemed confidential by the manufacturer may be marked to aid FDA in determining whether information may be disclosed under the public information regulation in part 20 of this chapter.', cap: '' },
          { id: 'M-820.180-b', text: '(b) Record retention period. All records required by this part shall be retained for a period of time equivalent to the design and expected life of the device, but in no case less than 2 years from the date of release for commercial distribution by the manufacturer.', cap: '' },
          { id: 'M-820.180-c', text: '(c) Exceptions. This section does not apply to the reports required by §820.20(c) Management review, §820.22 Quality audits, and supplier audit reports, but does apply to procedures established under these provisions. Upon request of a designated employee of FDA, an employee in management with executive responsibility shall certify in writing that the management reviews and quality audits required under this part have been performed and documented.', cap: 'GEN.20375 Document Control' },
        ],
      },
      {
        id: 'M-820.181',
        label: '§ 820.181 — Device Master Record',
        requirements: [
          { id: 'M-820.181-1', text: 'Each manufacturer shall maintain device master records (DMRs). Each manufacturer shall ensure that each DMR is prepared and approved in accordance with §820.40. The DMR for each type of device shall include, or refer to the location of, the following information.', cap: 'No direct parallel' },
          { id: 'M-820.181-a', text: '(a) Device specifications including appropriate drawings, composition, formulation, component specifications, and software specifications.', cap: 'No direct parallel' },
          { id: 'M-820.181-b', text: '(b) Production process specifications including the appropriate equipment specifications, production methods, production procedures, and production environment specifications.', cap: 'No direct parallel' },
          { id: 'M-820.181-c', text: '(c) Quality assurance procedures and specifications including acceptance criteria and the quality assurance equipment to be used.', cap: 'No direct parallel' },
          { id: 'M-820.181-d', text: '(d) Packaging and labeling specifications, including methods and processes used.', cap: 'No direct parallel' },
          { id: 'M-820.181-e', text: '(e) Installation, maintenance, and servicing procedures and methods.', cap: 'No direct parallel' },
        ],
      },
      {
        id: 'M-820.184',
        label: '§ 820.184 — Device History Record',
        requirements: [
          { id: 'M-820.184-1', text: 'Each manufacturer shall maintain device history records (DHRs). Each manufacturer shall establish and maintain procedures to ensure that DHRs for each batch, lot, or unit are maintained to demonstrate that the device is manufactured in accordance with the DMR and the requirements of this part.', cap: GEN_42195 },
          { id: 'M-820.184-a', text: '(a) The dates of manufacture.', cap: GEN_42195 },
          { id: 'M-820.184-b', text: '(b) The quantity manufactured.', cap: GEN_42195 },
          { id: 'M-820.184-c', text: '(c) The quantity released for distribution.', cap: GEN_42195 },
          { id: 'M-820.184-d', text: '(d) The acceptance records which demonstrate the device is manufactured in accordance with the DMR.', cap: GEN_42195 },
          { id: 'M-820.184-e', text: '(e) The primary identification label and labeling used for each production unit.', cap: GEN_42195 },
          { id: 'M-820.184-f', text: '(f) Any unique device identifier (UDI) or universal product code (UPC), and any other device identification(s) and control number(s) used.', cap: GEN_42195 },
        ],
      },
      {
        id: 'M-820.186',
        label: '§ 820.186 — Quality System Record',
        requirements: [
          { id: 'M-820.186-1', text: 'Each manufacturer shall maintain a quality system record (QSR). The QSR shall include, or refer to the location of, procedures and the documentation of activities required by this part that are not specific to a particular type of device(s), including, but not limited to, the records required by §820.20. Each manufacturer shall ensure that the QSR is prepared and approved in accordance with §820.40.', cap: 'GEN.20375 Document Control · GEN.43900 Archived Test Results · GEN.43946 Data Preservation/Destructive Event' },
        ],
      },
      {
        id: 'M-820.198',
        label: '§ 820.198 — Complaint Files',
        requirements: [
          { id: 'M-820.198-a', text: '(a) Each manufacturer shall maintain complaint files. Each manufacturer shall establish and maintain procedures for receiving, reviewing, and evaluating complaints by a formally designated unit.', cap: GEN_20208 },
          { id: 'M-820.198-a1', text: '(a)(1) All complaints are processed in a uniform and timely manner.', cap: GEN_20208 },
          { id: 'M-820.198-a2', text: '(a)(2) Oral complaints are documented upon receipt.', cap: GEN_20208 },
          { id: 'M-820.198-a3', text: '(a)(3) Complaints are evaluated to determine whether the complaint represents an event which is required to be reported to FDA under part 803 of this chapter, Medical Device Reporting.', cap: GEN_20208 },
          { id: 'M-820.198-b', text: '(b) Each manufacturer shall review and evaluate all complaints to determine whether an investigation is necessary. When no investigation is made, the manufacturer shall maintain a record that includes the reason no investigation was made and the name of the individual responsible for the decision not to investigate.', cap: GEN_20208 },
          { id: 'M-820.198-c', text: '(c) Any complaint involving the possible failure of a device, labeling, or packaging to meet any of its specifications shall be reviewed, evaluated, and investigated, unless such investigation has already been performed for a similar complaint and another investigation is not necessary.', cap: GEN_20208 },
          { id: 'M-820.198-d', text: '(d) Any complaint that represents an event which must be reported to FDA under part 803 of this chapter shall be promptly reviewed, evaluated, and investigated by a designated individual(s) and shall be maintained in a separate portion of the complaint files or otherwise clearly identified.', cap: GEN_20208 },
          { id: 'M-820.198-d1', text: '(d)(1) Whether the device failed to meet specifications.', cap: GEN_20208 },
          { id: 'M-820.198-d2', text: '(d)(2) Whether the device was being used for treatment or diagnosis.', cap: GEN_20208 },
          { id: 'M-820.198-d3', text: '(d)(3) The relationship, if any, of the device to the reported incident or adverse event.', cap: GEN_20208 },
          { id: 'M-820.198-e', text: '(e) When an investigation is made under this section, a record of the investigation shall be maintained by the formally designated unit identified in paragraph (a) of this section.', cap: GEN_20208 },
          { id: 'M-820.198-e1', text: '(e)(1) The name of the device.', cap: GEN_20208 },
          { id: 'M-820.198-e2', text: '(e)(2) The date the complaint was received.', cap: GEN_20208 },
          { id: 'M-820.198-e3', text: '(e)(3) Any unique device identifier (UDI) or universal product code (UPC), and any other device identification(s) and control number(s) used.', cap: GEN_20208 },
          { id: 'M-820.198-e4', text: '(e)(4) The name, address, and phone number of the complainant.', cap: GEN_20208 },
          { id: 'M-820.198-e5', text: '(e)(5) The nature and details of the complaint.', cap: GEN_20208 },
          { id: 'M-820.198-e6', text: '(e)(6) The dates and results of the investigation.', cap: GEN_20208 },
          { id: 'M-820.198-e7', text: '(e)(7) Any corrective action taken.', cap: GEN_20208 },
          { id: 'M-820.198-e8', text: '(e)(8) Any reply to the complainant.', cap: GEN_20208 },
          { id: 'M-820.198-f', text: '(f) When the manufacturer\'s formally designated complaint unit is located at a site separate from the manufacturing establishment, the investigated complaint(s) and the record(s) of investigation shall be reasonably accessible to the manufacturing establishment.', cap: 'Gen.20340 Notification from vendors' },
          { id: 'M-820.198-g', text: '(g) If a manufacturer\'s formally designated complaint unit is located outside of the United States, records required by this section shall be reasonably accessible in the United States at either: (1) a location in the United States where the manufacturer\'s records are regularly kept; or (2) the location of the initial distributor.', cap: '' },
        ],
      },
    ],
  },
  {
    letter: 'N',
    title: 'Servicing',
    sections: [
      {
        id: 'N-820.200',
        label: '§ 820.200 — Servicing',
        requirements: [
          { id: 'N-820.200-a', text: '(a) Where servicing is a specified requirement, each manufacturer shall establish and maintain instructions and procedures for performing and verifying that the servicing meets the specified requirements.', cap: 'Does not apply' },
          { id: 'N-820.200-b', text: '(b) Each manufacturer shall analyze service reports with appropriate statistical methodology in accordance with §820.100.', cap: '' },
          { id: 'N-820.200-c', text: '(c) Each manufacturer who receives a service report that represents an event which must be reported to FDA under part 803 of this chapter shall automatically consider the report a complaint and shall process it in accordance with the requirements of §820.198.', cap: '' },
          { id: 'N-820.200-d', text: '(d) Service reports shall be documented and shall include: the name of the device serviced; any UDI or UPC and other device identification(s) and control number(s) used; the date of service; the individual(s) servicing the device; the service performed; and the test and inspection data.', cap: '' },
        ],
      },
    ],
  },
  {
    letter: 'O',
    title: 'Statistical Techniques',
    sections: [
      {
        id: 'O-820.250',
        label: '§ 820.250 — Statistical Techniques',
        requirements: [
          { id: 'O-820.250-a', text: '(a) Where appropriate, each manufacturer shall establish and maintain procedures for identifying valid statistical techniques required for establishing, controlling, and verifying the acceptability of process capability and product characteristics.', cap: 'CAP requires genotype tracking, shifts/trends, as part of quality control, as well as PT · Mol.34495 Monthly QC review · Com.01300 PT Participation · Mol.20550 Test Result Statistics · Mol.34352 QC confirmation of acceptability · Mol.35360 Internal Controls · Gen.20316 QM indicators of Quality' },
          { id: 'O-820.250-b', text: '(b) Sampling plans, when used, shall be written and based on a valid statistical rationale. Each manufacturer shall establish and maintain procedures to ensure that sampling methods are adequate for their intended use and to ensure that when changes occur the sampling plans are reviewed. These activities shall be documented.', cap: 'CAP requires genotype tracking, shifts/trends, as part of quality control, as well as PT · Mol.34495 Monthly QC review · Com.01300 PT Participation · Mol.20550 Test Result Statistics · Mol.34352 QC confirmation of acceptability · Mol.35360 Internal Controls · Gen.20316 QM indicators of Quality' },
        ],
      },
    ],
  },
];

export function getAllRequirements(): Requirement[] {
  return SUBPARTS.flatMap(sp => sp.sections.flatMap(sec => sec.requirements));
}
