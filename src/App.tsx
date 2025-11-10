import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NovoMedicamento from "./pages/NovoMedicamento";
import RecuperarSenha from "./pages/RecuperarSenha";
import EditarPerfil from "./pages/EditarPerfil";
import Cuidadores from "./pages/Cuidadores";
import PacientesMonitorados from "./pages/PacientesMonitorados";
import HistoricoPaciente from "./pages/HistoricoPaciente";
import AdicionarMedicamentoCuidador from "./pages/AdicionarMedicamentoCuidador";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
          <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/novo-medicamento" element={<NovoMedicamento />} />
        <Route path="/editar-medicamento/:id" element={<NovoMedicamento />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />
        <Route path="/editar-perfil" element={<EditarPerfil />} />
        <Route path="/cuidadores" element={<Cuidadores />} />
        <Route path="/pacientes-monitorados" element={<PacientesMonitorados />} />
        <Route path="/historico/:usuarioId" element={<HistoricoPaciente />} />
        <Route path="/adicionar-medicamento/:pacienteId" element={<AdicionarMedicamentoCuidador />} />
        <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
