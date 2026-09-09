var patientSeeds = [
    ['p1', 'Juliana Souza', 32, 'Jardim Esperança', 'Feminino'],
    ['p2', 'Marina Alves', 41, 'Centro', 'Feminino'],
    ['p3', 'Rafael Costa', 27, 'Vila Nova', 'Masculino'],
    ['p4', 'Beatriz Santos', 56, 'Santa Clara', 'Feminino'],
    ['p5', 'Carlos Oliveira', 63, 'Centro', 'Masculino'],
    ['p6', 'Lívia Rocha', 22, 'Bela Vista', 'Feminino'],
    ['p7', 'Paulo Mendes', 48, 'Jardim União', 'Masculino'],
    ['p8', 'Sônia Ribeiro', 69, 'Vila Nova', 'Feminino'],
    ['p9', 'Diego Martins', 35, 'Santa Clara', 'Masculino'],
    ['p10', 'Helena Freitas', 29, 'Bela Vista', 'Feminino'],
    ['p11', 'Renata Pires', 37, 'Jardim Esperança', 'Feminino'],
    ['p12', 'Eduardo Melo', 46, 'Centro', 'Masculino'],
    ['p13', 'Fátima Correia', 58, 'Vila Nova', 'Feminino'],
    ['p14', 'Gustavo Ramos', 24, 'Bela Vista', 'Masculino'],
    ['p15', 'Irene Cardoso', 66, 'Santa Clara', 'Feminino'],
    ['w1', 'Ana Lima', 38, 'Centro', 'Feminino'],
    ['w2', 'Carla Souza', 45, 'Jardim União', 'Feminino'],
    ['w3', 'João Ferreira', 51, 'Vila Nova', 'Masculino'],
    ['w4', 'Marta Reis', 34, 'Centro', 'Feminino'],
    ['w5', 'Pedro Nunes', 60, 'Santa Clara', 'Masculino'],
    ['w6', 'Luciana Gomes', 26, 'Bela Vista', 'Feminino'],
    ['w7', 'Antônio Barros', 72, 'Jardim Esperança', 'Masculino'],
    ['w8', 'Camila Araújo', 31, 'Centro', 'Feminino'],
    ['w9', 'Bruno Dias', 43, 'Vila Nova', 'Masculino'],
    ['w10', 'Nádia Melo', 54, 'Santa Clara', 'Feminino'],
];
export var mockPatients = patientSeeds.map(function (_a, index) {
    var id = _a[0], name = _a[1], age = _a[2], neighbourhood = _a[3], gender = _a[4];
    return ({
        id: id,
        name: name,
        age: age,
        neighbourhood: neighbourhood,
        gender: gender,
        comorbidities: index % 3 === 0 ? ['Hipertensão (dado fictício)'] : [],
        preferences: {
            channels: index % 2 ? ['E-mail', 'Push'] : ['WhatsApp', 'Push'],
            phone: "(11) 90000-".concat(String(1000 + index)),
            email: "".concat(name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(' ', '.'), "@exemplo.test"),
        },
    });
});
var appointmentSeeds = [
    ['a1', 'p1', 'Clínica Geral', 'UBS Central', '2026-09-05', '10:20', 'AWAITING', .74, 31, true],
    ['a2', 'p2', 'Clínica Geral', 'UBS Central', '2026-09-05', '09:00', 'AWAITING', .61, 24, false],
    ['a3', 'p3', 'Cardiologia', 'Centro de Especialidades', '2026-09-03', '08:20', 'CONFIRMED', .25, 8, true],
    ['a4', 'p4', 'Dermatologia', 'UBS Norte', '2026-09-03', '09:40', 'AWAITING', .53, 19, true],
    ['a5', 'p5', 'Cardiologia', 'Centro de Especialidades', '2026-09-03', '11:00', 'CONFIRMED', .32, 12, true],
    ['a6', 'p6', 'Clínica Geral', 'UBS Sul', '2026-09-03', '13:30', 'AWAITING', .69, 28, false],
    ['a7', 'p7', 'Ortopedia', 'Centro de Especialidades', '2026-09-04', '08:00', 'AWAITING', .47, 17, true],
    ['a8', 'p8', 'Clínica Geral', 'UBS Central', '2026-09-04', '09:20', 'CONFIRMED', .22, 5, true],
    ['a9', 'p9', 'Dermatologia', 'UBS Norte', '2026-09-04', '10:40', 'AWAITING', .39, 14, true],
    ['a10', 'p10', 'Pediatria', 'UBS Sul', '2026-09-04', '14:10', 'RESCHEDULE_REQUESTED', .58, 21, false],
    ['a11', 'p3', 'Clínica Geral', 'UBS Norte', '2026-09-08', '15:00', 'AWAITING', .44, 15, true],
    ['a12', 'p4', 'Cardiologia', 'Centro de Especialidades', '2026-09-09', '08:40', 'AWAITING', .76, 35, false],
    ['a13', 'p5', 'Ortopedia', 'Centro de Especialidades', '2026-09-09', '10:00', 'CONFIRMED', .29, 9, true],
    ['a14', 'p6', 'Pediatria', 'UBS Sul', '2026-09-10', '13:00', 'AWAITING', .51, 20, true],
    ['a15', 'p7', 'Clínica Geral', 'UBS Central', '2026-09-11', '16:00', 'AWAITING', .67, 26, false],
    ['a16', 'p11', 'Clínica Geral', 'UBS Norte', '2026-09-12', '08:30', 'AWAITING', .43, 16, true],
    ['a17', 'p12', 'Cardiologia', 'Centro de Especialidades', '2026-09-12', '09:50', 'CONFIRMED', .31, 11, true],
    ['a18', 'p13', 'Dermatologia', 'UBS Central', '2026-09-14', '13:40', 'AWAITING', .71, 29, false],
    ['a19', 'p14', 'Ortopedia', 'Centro de Especialidades', '2026-09-15', '15:10', 'AWAITING', .49, 18, true],
    ['a20', 'p15', 'Clínica Geral', 'UBS Sul', '2026-09-16', '10:10', 'CONFIRMED', .27, 7, true],
];
var level = function (probability) { return probability >= .65 ? 'HIGH' : probability >= .4 ? 'MEDIUM' : 'LOW'; };
export var mockAppointments = appointmentSeeds.map(function (_a) {
    var id = _a[0], patientId = _a[1], specialty = _a[2], unit = _a[3], date = _a[4], time = _a[5], status = _a[6], riskProbability = _a[7], waitingDays = _a[8], smsReceived = _a[9];
    return ({
        id: id,
        patientId: patientId,
        specialty: specialty,
        unit: unit,
        date: date,
        time: time,
        status: status,
        riskProbability: riskProbability,
        riskLevel: level(riskProbability),
        waitingDays: waitingDays,
        smsReceived: smsReceived,
        address: unit === 'UBS Central' ? 'Rua das Flores, 120 - Centro' : unit === 'UBS Sul' ? 'Av. Horizonte, 450 - Zona Sul' : unit === 'UBS Norte' ? 'Rua Ipê, 88 - Zona Norte' : 'Av. Saúde, 300 - Centro',
    });
});
var waitlistSeeds = [
    ['q1', 'w1', 'Clínica Geral', 'UBS Central', ['morning'], 1, '2026-08-10', 'WhatsApp'],
    ['q2', 'w2', 'Clínica Geral', 'UBS Central', ['morning', 'afternoon'], 2, '2026-08-12', 'Push'],
    ['q3', 'w3', 'Cardiologia', 'Centro de Especialidades', ['morning'], 1, '2026-08-14', 'Ligação'],
    ['q4', 'w4', 'Clínica Geral', 'UBS Central', ['afternoon'], 3, '2026-08-15', 'E-mail'],
    ['q5', 'w5', 'Ortopedia', 'Centro de Especialidades', ['morning'], 1, '2026-08-17', 'Ligação'],
    ['q6', 'w6', 'Pediatria', 'UBS Sul', ['afternoon'], 1, '2026-08-18', 'WhatsApp'],
    ['q7', 'w7', 'Clínica Geral', 'UBS Norte', ['morning', 'afternoon'], 1, '2026-08-19', 'Push'],
    ['q8', 'w8', 'Dermatologia', 'UBS Norte', ['morning'], 1, '2026-08-21', 'E-mail'],
    ['q9', 'w9', 'Cardiologia', 'Centro de Especialidades', ['afternoon'], 2, '2026-08-22', 'WhatsApp'],
    ['q10', 'w10', 'Clínica Geral', 'UBS Central', ['morning'], 4, '2026-08-23', 'Ligação'],
];
export var mockWaitlist = waitlistSeeds.map(function (_a) {
    var id = _a[0], patientId = _a[1], specialty = _a[2], unit = _a[3], availablePeriods = _a[4], queuePriority = _a[5], enteredAt = _a[6], preferredContact = _a[7];
    return ({
        id: id,
        patientId: patientId,
        specialty: specialty,
        unit: unit,
        availablePeriods: availablePeriods,
        queuePriority: queuePriority,
        enteredAt: enteredAt,
        preferredContact: preferredContact,
        status: 'AGUARDANDO',
    });
});
export function createInitialState() {
    return structuredClone({
        patients: mockPatients,
        appointments: mockAppointments,
        waitlist: mockWaitlist,
        communications: [
            { id: 'c1', patientId: 'p1', appointmentId: 'a1', channel: 'Push', eventType: 'Lembrete de consulta', origin: 'Sistema', message: 'Lembrete demonstrativo: sua consulta será em 3 dias.', status: 'Entregue (simulação)', createdAt: '2026-09-02T09:00:00' },
            { id: 'c2', patientId: 'p2', appointmentId: 'a2', channel: 'WhatsApp', eventType: 'Solicitação de confirmação', origin: 'Sistema', message: 'Solicitação de confirmação enviada.', status: 'Enviada (simulação)', createdAt: '2026-09-02T10:30:00' },
        ],
        notifications: [
            { id: 'n1', patientId: 'p1', title: 'Sua consulta está próxima', message: 'Lembrete de 3 dias: confirme se poderá comparecer.', createdAt: '2026-09-02T09:00:00', read: false, channel: 'Push', status: 'Entregue (simulação)', recipient: 'Juliana Souza' },
            { id: 'n2', patientId: 'p1', title: 'Ambiente demonstrativo', message: 'Nenhuma mensagem real será enviada por este aplicativo.', createdAt: '2026-09-01T12:00:00', read: true, channel: 'Aplicativo MedPredict', status: 'Exibida' },
            { id: 'n3', patientId: 'p1', title: 'Lembrete de 7 dias', message: 'Sua consulta está agendada para a próxima semana.', createdAt: '2026-08-29T09:00:00', read: true, channel: 'E-mail', status: 'Entregue (simulação)', recipient: 'Juliana Souza' },
            { id: 'n4', patientId: 'p1', title: 'Lembrete de 1 dia', message: 'Simulação do aviso que seria apresentado um dia antes da consulta.', createdAt: '2026-09-04T09:00:00', read: false, channel: 'WhatsApp', status: 'Enviada (simulação)', recipient: 'Juliana Souza' },
        ],
        recoveries: [],
        rescheduleRequests: [{ id: 'rr0', appointmentId: 'a10', patientId: 'p10', requestedDate: '2026-09-12', requestedTime: '15:00', status: 'PENDING', createdAt: '2026-09-01T15:00:00' }],
        demoPatientId: 'p1',
    });
}
