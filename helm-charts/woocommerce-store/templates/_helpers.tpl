{{/*
Expand the name of the chart.
*/}}
{{- define "woocommerce-store.name" -}}
{{- default .Chart.Name .Values.storeName | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "woocommerce-store.fullname" -}}
{{- $name := default .Chart.Name .Values.storeName }}
{{- printf "%s" $name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "woocommerce-store.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "woocommerce-store.labels" -}}
helm.sh/chart: {{ include "woocommerce-store.chart" . }}
{{ include "woocommerce-store.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app: urumi-store
store-name: {{ .Values.storeName }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "woocommerce-store.selectorLabels" -}}
app.kubernetes.io/name: {{ include "woocommerce-store.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
MySQL labels
*/}}
{{- define "woocommerce-store.mysql.labels" -}}
{{ include "woocommerce-store.labels" . }}
app.kubernetes.io/component: mysql
{{- end }}

{{/*
MySQL selector labels
*/}}
{{- define "woocommerce-store.mysql.selectorLabels" -}}
{{ include "woocommerce-store.selectorLabels" . }}
app.kubernetes.io/component: mysql
{{- end }}

{{/*
WordPress labels
*/}}
{{- define "woocommerce-store.wordpress.labels" -}}
{{ include "woocommerce-store.labels" . }}
app.kubernetes.io/component: wordpress
{{- end }}

{{/*
WordPress selector labels
*/}}
{{- define "woocommerce-store.wordpress.selectorLabels" -}}
{{ include "woocommerce-store.selectorLabels" . }}
app.kubernetes.io/component: wordpress
{{- end }}

{{/*
Generate random password
*/}}
{{- define "woocommerce-store.randomPassword" -}}
{{- randAlphaNum 16 }}
{{- end }}
