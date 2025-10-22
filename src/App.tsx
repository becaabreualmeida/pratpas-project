import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NovoMedicamento from "./pages/NovoMedicamento";
import RecuperarSenha from "./pages/RecuperarSenha";
import EditarPerfil from "./pages/EditarPerfil";
import Cuidadores from "./pages/Cuidadores";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/novo-medicamento" element={<NovoMedicamento />} />
        <Route path="/editar-medicamento/:id" element={<NovoMedicamento />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />
        <Route path="/editar-perfil" element={<EditarPerfil />} />
        <Route path="/cuidadores" element={<Cuidadores />} />
        <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
