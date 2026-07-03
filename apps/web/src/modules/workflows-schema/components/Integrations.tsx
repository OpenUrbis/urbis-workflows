import { getAccessToken } from "../../../auth/token";
import { Spinner } from "../../../components/LegacyUi";
import { HelpTooltipClickable } from "../../../components";
import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSnackbar } from "../../../hooks/snackbar";
import { CodeEditor } from "./CodeEditor";
import { ProtocolIntegrations } from "../../../types/global";
import {
  Label,
  Input as DSInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@open-urbis/map-ui";

enum LoadingTypes {
  NOT_LOADING = 0,
  SEI_UNITS = 1,
  SEI_PROCESSES_TYPES = 2,
  SEI_DOCUMENTS_TYPES = 3,
  SEI_LEGAL_HYPOTHESIS = 4,
}

export type IntegrationsProps = {
  data: ProtocolIntegrations["sei"] | undefined;
  onChange: (data: ProtocolIntegrations["sei"]) => void;
};

export const Integrations: React.FC<IntegrationsProps> = ({
  data,
  onChange,
}): JSX.Element => {
  const snackbar = useSnackbar();
  const [integrations, setIntegrations] = useState<ProtocolIntegrations["sei"]>(
    data ?? {}
  );
  const [seiUnits, setSeiUnits] = useState<
    { id: string; description: string }[]
  >([]);
  const [seiProcessesTypes, setSeiProcessesTypes] = useState<
    { id: string; description: string }[]
  >([]);
  const [seiDocumentsTypes, setSeiDocumentsTypes] = useState<
    { id: string; description: string }[]
  >([]);
  const [seiLegalHypothesis, setSeiLegalHypothesis] = useState<
    { id: string; description: string }[]
  >([]);
  const [loading, setLoading] = useState<LoadingTypes>(0);

  // Search state for all searchable dropdowns
  const [unitSearch, setUnitSearch] = useState("");
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const unitContainerRef = useRef<HTMLDivElement>(null);

  const [processSearch, setProcessSearch] = useState("");
  const [processDropdownOpen, setProcessDropdownOpen] = useState(false);
  const processContainerRef = useRef<HTMLDivElement>(null);

  const [legalSearch, setLegalSearch] = useState("");
  const [legalDropdownOpen, setLegalDropdownOpen] = useState(false);
  const legalContainerRef = useRef<HTMLDivElement>(null);

  const [coverDocSearch, setCoverDocSearch] = useState("");
  const [coverDocDropdownOpen, setCoverDocDropdownOpen] = useState(false);
  const coverDocContainerRef = useRef<HTMLDivElement>(null);

  const [docSearch, setDocSearch] = useState("");
  const [docDropdownOpen, setDocDropdownOpen] = useState(false);
  const docContainerRef = useRef<HTMLDivElement>(null);

  const [taxDocSearch, setTaxDocSearch] = useState("");
  const [taxDocDropdownOpen, setTaxDocDropdownOpen] = useState(false);
  const taxDocContainerRef = useRef<HTMLDivElement>(null);

  const handleFetchSeiUnits = async () => {
    setLoading(LoadingTypes.SEI_UNITS);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACK_END_API}/integrations/sei/units`,
        {
          headers: {
            authorization: `Bearer ${getAccessToken()}`,
          },
        }
      );

      setSeiUnits(Array.isArray(response.data) ? response.data : []);
    } catch (e) {
      snackbar.error("Não foi possível buscar as unidades SEI");
    }
    setLoading(LoadingTypes.NOT_LOADING);
  };

  const handleFetchSeiProcessesTypes = async () => {
    setLoading(LoadingTypes.SEI_PROCESSES_TYPES);

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACK_END_API}/integrations/sei/processes-types`,
        {
          params: {
            IdUnidade: integrations?.IdUnidade,
          },
          headers: {
            authorization: `Bearer ${getAccessToken()}`,
          },
        }
      );

      setSeiProcessesTypes(Array.isArray(response.data) ? response.data : []);
    } catch (e) {
      snackbar.error("Não foi possível buscar os tipos de processo");
    }

    setLoading(LoadingTypes.NOT_LOADING);
  };

  const handleFetchSeiDocumentsTypes = async () => {
    setLoading(LoadingTypes.SEI_DOCUMENTS_TYPES);

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACK_END_API}/integrations/sei/documents-types`,
        {
          params: {
            IdUnidade: integrations?.IdUnidade,
            IdTipoProcedimento: integrations?.IdTipoProcedimento,
          },
          headers: {
            authorization: `Bearer ${getAccessToken()}`,
          },
        }
      );

      setSeiDocumentsTypes(Array.isArray(response.data) ? response.data : []);
    } catch (e) {
      snackbar.error("Não foi possível buscar os tipos de documentos");
    }

    setLoading(LoadingTypes.NOT_LOADING);
  };

  useEffect(() => {
    handleFetchSeiUnits();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (integrations?.IdUnidade !== undefined) {
      handleFetchSeiProcessesTypes();
    }
    // eslint-disable-next-line
  }, [integrations?.IdUnidade]);

  const handleFetchSeiLegalHypothesis = async () => {
    setLoading(LoadingTypes.SEI_LEGAL_HYPOTHESIS);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACK_END_API}/integrations/sei/legal-hypothesis`,
        {
          params: {
            IdUnidade: integrations?.IdUnidade,
          },
          headers: {
            authorization: `Bearer ${getAccessToken()}`,
          },
        }
      );
      setSeiLegalHypothesis(Array.isArray(response.data) ? response.data : []);
    } catch (e) {
      snackbar.error("Não foi possível buscar as hipóteses legais");
    }
    setLoading(LoadingTypes.NOT_LOADING);
  };

  useEffect(() => {
    if (integrations?.IdTipoProcedimento !== undefined) {
      handleFetchSeiDocumentsTypes();
    }
    // eslint-disable-next-line
  }, [integrations?.IdTipoProcedimento]);

  useEffect(() => {
    if (
      integrations?.IdUnidade !== undefined &&
      integrations?.NivelAcesso !== undefined &&
      integrations.NivelAcesso > 0
    ) {
      handleFetchSeiLegalHypothesis();
    }
    // eslint-disable-next-line
  }, [integrations?.IdUnidade, integrations?.NivelAcesso]);

  // Helper to filter items (max 50 visible)
  const filterItems = useCallback(
    (items: { id: string; description: string }[], search: string) => {
      if (!search) return { filtered: items.slice(0, 50), total: items.length };
      const q = search.toLowerCase();
      const matches: { id: string; description: string }[] = [];
      let total = 0;
      for (const item of items) {
        if (item.description.toLowerCase().includes(q)) {
          total++;
          if (matches.length < 50) matches.push(item);
        }
      }
      return { filtered: matches, total };
    },
    [],
  );

  const { filtered: filteredUnits, total: totalFilteredUnits } = useMemo(
    () => filterItems(seiUnits, unitSearch), [seiUnits, unitSearch, filterItems]);
  const { filtered: filteredProcesses, total: totalFilteredProcesses } = useMemo(
    () => filterItems(seiProcessesTypes, processSearch), [seiProcessesTypes, processSearch, filterItems]);
  const { filtered: filteredLegal, total: totalFilteredLegal } = useMemo(
    () => filterItems(seiLegalHypothesis, legalSearch), [seiLegalHypothesis, legalSearch, filterItems]);
  const { filtered: filteredCoverDocs, total: totalFilteredCoverDocs } = useMemo(
    () => filterItems(seiDocumentsTypes, coverDocSearch), [seiDocumentsTypes, coverDocSearch, filterItems]);
  const { filtered: filteredDocs, total: totalFilteredDocs } = useMemo(
    () => filterItems(seiDocumentsTypes, docSearch), [seiDocumentsTypes, docSearch, filterItems]);
  const { filtered: filteredTaxDocs, total: totalFilteredTaxDocs } = useMemo(
    () => filterItems(seiDocumentsTypes, taxDocSearch), [seiDocumentsTypes, taxDocSearch, filterItems]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (unitContainerRef.current && !unitContainerRef.current.contains(target)) setUnitDropdownOpen(false);
      if (processContainerRef.current && !processContainerRef.current.contains(target)) setProcessDropdownOpen(false);
      if (legalContainerRef.current && !legalContainerRef.current.contains(target)) setLegalDropdownOpen(false);
      if (coverDocContainerRef.current && !coverDocContainerRef.current.contains(target)) setCoverDocDropdownOpen(false);
      if (docContainerRef.current && !docContainerRef.current.contains(target)) setDocDropdownOpen(false);
      if (taxDocContainerRef.current && !taxDocContainerRef.current.contains(target)) setTaxDocDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    onChange(integrations);
  }, [integrations, onChange]);

  return (
    <div className="flex flex-col md:w-1/2 mx-auto space-y-6">
      <h2 className="text-xl md:text-2xl font-bold mb-2 text-center">
        SEI
      </h2>

      {/* Unidade */}
      <div className="space-y-2">
        <Label htmlFor="IdUnidade">Unidade</Label>
        {loading === LoadingTypes.SEI_UNITS ? (
          <div className="text-center py-2"><Spinner /></div>
        ) : (
          <div className="relative" ref={unitContainerRef}>
            <DSInput
              placeholder={integrations?.IdUnidade
                ? seiUnits.find((u) => u.id === integrations.IdUnidade)?.description ?? "Buscar unidade..."
                : "Buscar unidade..."}
              value={unitSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setUnitSearch(e.target.value);
                setUnitDropdownOpen(true);
              }}
              onFocus={() => setUnitDropdownOpen(true)}
              className="h-11 bg-background text-foreground"
            />
            {unitDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-md border bg-background shadow-lg">
                {filteredUnits.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Nenhuma unidade encontrada</div>
                ) : (
                  <>
                    {filteredUnits.map((unit) => (
                      <div
                        key={`unit-${unit.id}`}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-muted text-foreground truncate"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setIntegrations({ ...integrations, IdUnidade: unit.id });
                          setUnitSearch("");
                          setUnitDropdownOpen(false);
                        }}
                      >
                        {unit.description}
                      </div>
                    ))}
                    {totalFilteredUnits > 50 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground border-t">
                        Mostrando 50 de {totalFilteredUnits} resultados. Refine sua busca.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tipo do procedimento */}
      <div className="space-y-2">
        <Label htmlFor="IdTipoProcedimento">Tipo do procedimento</Label>
        {loading === LoadingTypes.SEI_PROCESSES_TYPES ? (
          <div className="text-center py-2"><Spinner /></div>
        ) : (
          <div className="relative" ref={processContainerRef}>
            <DSInput
              placeholder={integrations?.IdTipoProcedimento
                ? seiProcessesTypes.find((t) => t.id === integrations.IdTipoProcedimento)?.description ?? "Buscar tipo de procedimento..."
                : "Buscar tipo de procedimento..."}
              value={processSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setProcessSearch(e.target.value);
                setProcessDropdownOpen(true);
              }}
              onFocus={() => setProcessDropdownOpen(true)}
              className="h-11 bg-background text-foreground"
            />
            {processDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-md border bg-background shadow-lg">
                {filteredProcesses.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum tipo encontrado</div>
                ) : (
                  <>
                    {filteredProcesses.map((type) => (
                      <div
                        key={`process-${type.id}`}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-muted text-foreground truncate"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setIntegrations({ ...integrations, IdTipoProcedimento: type.id });
                          setProcessSearch("");
                          setProcessDropdownOpen(false);
                        }}
                      >
                        {type.description}
                      </div>
                    ))}
                    {totalFilteredProcesses > 50 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground border-t">
                        Mostrando 50 de {totalFilteredProcesses} resultados. Refine sua busca.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nível de acesso */}
      <div className="space-y-2">
        <Label htmlFor="NivelAcesso">Nível de acesso</Label>
        <Select
          value={String(integrations?.NivelAcesso ?? 0)}
          onValueChange={(value) =>
            setIntegrations({
              ...integrations,
              NivelAcesso: Number(value) as 0 | 1 | 2,
            })
          }
        >
          <SelectTrigger className="h-11 bg-background text-foreground">
            <SelectValue placeholder="Selecione o nível de acesso" />
          </SelectTrigger>
          <SelectContent className="z-50 bg-background text-foreground">
            <SelectItem value="0">Público</SelectItem>
            <SelectItem value="1">Restrito</SelectItem>
            <SelectItem value="2">Sigiloso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Hipótese Legal */}
      {integrations?.NivelAcesso !== undefined &&
        integrations.NivelAcesso > 0 && (
          <div className="space-y-2">
            <Label htmlFor="IdHipoteseLegal">Hipótese Legal</Label>
            {loading === LoadingTypes.SEI_LEGAL_HYPOTHESIS ? (
              <div className="text-center py-2"><Spinner /></div>
            ) : (
              <div className="relative" ref={legalContainerRef}>
                <DSInput
                  placeholder={integrations?.IdHipoteseLegal
                    ? seiLegalHypothesis.find((h) => h.id === String(integrations.IdHipoteseLegal))?.description ?? "Buscar hipótese legal..."
                    : "Buscar hipótese legal..."}
                  value={legalSearch}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setLegalSearch(e.target.value);
                    setLegalDropdownOpen(true);
                  }}
                  onFocus={() => setLegalDropdownOpen(true)}
                  className="h-11 bg-background text-foreground"
                />
                {legalDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-md border bg-background shadow-lg">
                    {filteredLegal.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">Nenhuma hipótese encontrada</div>
                    ) : (
                      <>
                        {filteredLegal.map((h) => (
                          <div
                            key={`hypothesis-${h.id}`}
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-muted text-foreground truncate"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setIntegrations({ ...integrations, IdHipoteseLegal: h.id });
                              setLegalSearch("");
                              setLegalDropdownOpen(false);
                            }}
                          >
                            {h.description}
                          </div>
                        ))}
                        {totalFilteredLegal > 50 && (
                          <div className="px-3 py-2 text-xs text-muted-foreground border-t">
                            Mostrando 50 de {totalFilteredLegal} resultados. Refine sua busca.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      {/* Tipo do documento da folha de rosto */}
      <div className="space-y-2">
        <Label htmlFor="CoverLetterIdSerie">Tipo do documento da folha de rosto</Label>
        {loading === LoadingTypes.SEI_DOCUMENTS_TYPES ? (
          <div className="text-center py-2"><Spinner /></div>
        ) : (
          <div className="relative" ref={coverDocContainerRef}>
            <DSInput
              placeholder={integrations?.CoverLetterIdSerie
                ? seiDocumentsTypes.find((t) => t.id === String(integrations.CoverLetterIdSerie))?.description ?? "Buscar tipo de documento..."
                : "Buscar tipo de documento..."}
              value={coverDocSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setCoverDocSearch(e.target.value);
                setCoverDocDropdownOpen(true);
              }}
              onFocus={() => setCoverDocDropdownOpen(true)}
              className="h-11 bg-background text-foreground"
            />
            {coverDocDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-md border bg-background shadow-lg">
                {filteredCoverDocs.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum tipo encontrado</div>
                ) : (
                  <>
                    {filteredCoverDocs.map((type) => (
                      <div
                        key={`cover-${type.id}`}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-muted text-foreground truncate"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setIntegrations({ ...integrations, CoverLetterIdSerie: Number(type.id) });
                          setCoverDocSearch("");
                          setCoverDocDropdownOpen(false);
                        }}
                      >
                        {type.description}
                      </div>
                    ))}
                    {totalFilteredCoverDocs > 50 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground border-t">
                        Mostrando 50 de {totalFilteredCoverDocs} resultados. Refine sua busca.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Folha de rosto */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="coverLetter">Folha de rosto</Label>
          <HelpTooltipClickable
            tooltip={
              '<p class="mb-2"><strong>Conteúdo HTML</strong> da folha de rosto enviada ao SEI na abertura do processo.</p>' +
              '<p class="mb-2">Use tags HTML (ex.: <code>&lt;p&gt;</code>, <code>&lt;table&gt;</code>, <code>&lt;strong&gt;</code>) para formatar o texto.</p>' +
              '<p class="mb-2"><strong>Template / variáveis:</strong> o conteúdo é processado e os placeholders <code>{{ caminho }}</code> são substituídos pelos dados do contexto. Use a mesma estrutura do modal <strong>Dados do Contexto</strong>: <code>activity</code> (id, state, createdAt, createdBy, <code>form</code>). Os campos do formulário ficam em <code>activity.form</code>. Ex.: <code>{{ activity.form.localidade }}</code>, <code>{{ activity.id }}</code>.</p>'
            }
          />
        </div>
        <CodeEditor
          language="html"
          height="200px"
          value={integrations?.coverLetter ?? ""}
          onChange={(code) => {
            setIntegrations({
              ...integrations,
              coverLetter: code,
            });
          }}
        />
      </div>

      {/* Despacho (template do resumo para agendar publicação ao encerrar processo) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="publicationSummaryTemplate">Despacho</Label>
          <HelpTooltipClickable
            tooltip={
              '<p class="mb-2">Texto usado como <strong>Resumo</strong> na chamada <strong>agendarPublicacao</strong> do SEI quando o processo for encerrado (todas as atividades concluídas).</p>' +
              '<p class="mb-2">O agendamento de publicação é disparado após o encerramento do processo. Configure também o veículo de publicação abaixo quando necessário.</p>' +
              '<p class="mb-2"><strong>Template / variáveis:</strong> o conteúdo é processado e os placeholders <code>{{ caminho }}</code> são substituídos pelos dados do contexto. Use a mesma estrutura do modal <strong>Dados do Contexto</strong>: <code>activity</code> (id, state, createdAt, createdBy, <code>form</code>). Os campos do formulário ficam em <code>activity.form</code>. Ex.: <code>{{ activity.form.localidade }}</code>, <code>{{ activity.id }}</code>.</p>'
            }
          />
        </div>
        <CodeEditor
          language="html"
          height="200px"
          value={integrations?.publicationSummaryTemplate ?? ""}
          onChange={(code) => {
            setIntegrations({
              ...integrations,
              publicationSummaryTemplate: code,
            });
          }}
        />
        <div className="space-y-2 pt-2">
          <Label htmlFor="IdVeiculoPublicacao">Id do veículo de publicação (SEI)</Label>
          <DSInput
            id="IdVeiculoPublicacao"
            placeholder="Opcional. Informado em agendarPublicacao ao encerrar."
            value={integrations?.IdVeiculoPublicacao ?? ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setIntegrations({
                ...integrations,
                IdVeiculoPublicacao: e.target.value || undefined,
              });
            }}
            className="h-11 bg-background text-foreground"
          />
        </div>
      </div>

      {/* Tipo do documento */}
      <div className="space-y-2">
        <Label htmlFor="DocumentIdSerie">Tipo do documento</Label>
        {loading === LoadingTypes.SEI_DOCUMENTS_TYPES ? (
          <div className="text-center py-2"><Spinner /></div>
        ) : (
          <div className="relative" ref={docContainerRef}>
            <DSInput
              placeholder={integrations?.DocumentIdSerie
                ? seiDocumentsTypes.find((t) => t.id === String(integrations.DocumentIdSerie))?.description ?? "Buscar tipo de documento..."
                : "Buscar tipo de documento..."}
              value={docSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setDocSearch(e.target.value);
                setDocDropdownOpen(true);
              }}
              onFocus={() => setDocDropdownOpen(true)}
              className="h-11 bg-background text-foreground"
            />
            {docDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-md border bg-background shadow-lg">
                {filteredDocs.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum tipo encontrado</div>
                ) : (
                  <>
                    {filteredDocs.map((type) => (
                      <div
                        key={`doc-${type.id}`}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-muted text-foreground truncate"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setIntegrations({
                            ...integrations,
                            DocumentIdSerie: Number(type.id),
                            PlateIdSerie: Number(type.id),
                          });
                          setDocSearch("");
                          setDocDropdownOpen(false);
                        }}
                      >
                        {type.description}
                      </div>
                    ))}
                    {totalFilteredDocs > 50 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground border-t">
                        Mostrando 50 de {totalFilteredDocs} resultados. Refine sua busca.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tipo do documento do boleto */}
      <div className="space-y-2">
        <Label htmlFor="TaxDocumentIdSerie">Tipo do documento do boleto</Label>
        {loading === LoadingTypes.SEI_DOCUMENTS_TYPES ? (
          <div className="text-center py-2"><Spinner /></div>
        ) : (
          <div className="relative" ref={taxDocContainerRef}>
            <DSInput
              placeholder={integrations?.TaxDocumentIdSerie
                ? seiDocumentsTypes.find((t) => t.id === String(integrations.TaxDocumentIdSerie))?.description ?? "Buscar tipo de documento..."
                : "Buscar tipo de documento..."}
              value={taxDocSearch}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setTaxDocSearch(e.target.value);
                setTaxDocDropdownOpen(true);
              }}
              onFocus={() => setTaxDocDropdownOpen(true)}
              className="h-11 bg-background text-foreground"
            />
            {taxDocDropdownOpen && (
              <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-md border bg-background shadow-lg">
                {filteredTaxDocs.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum tipo encontrado</div>
                ) : (
                  <>
                    {filteredTaxDocs.map((type) => (
                      <div
                        key={`tax-${type.id}`}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-muted text-foreground truncate"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setIntegrations({ ...integrations, TaxDocumentIdSerie: Number(type.id) });
                          setTaxDocSearch("");
                          setTaxDocDropdownOpen(false);
                        }}
                      >
                        {type.description}
                      </div>
                    ))}
                    {totalFilteredTaxDocs > 50 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground border-t">
                        Mostrando 50 de {totalFilteredTaxDocs} resultados. Refine sua busca.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
